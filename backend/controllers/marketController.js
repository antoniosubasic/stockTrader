import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const marketsFile = './data/markets.json';
const stockPricesFolder = './data/stockPrices';

const timestampToISO = timestamp => new Date(timestamp).toISOString().split('T')[0];
const UTCTimestamp = (daysAgo = null) => {
    const now = new Date();
    const ago = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (daysAgo || 0));
    return Date.UTC(ago.getUTCFullYear(), ago.getUTCMonth(), ago.getUTCDate());
}

export class Controller {
    _markets = null;

    constructor() {
        this._markets = JSON.parse(fs.readFileSync(marketsFile));

        this._markets.forEach(market => {
            const stockPricesFile = `${stockPricesFolder}/${market.symbol}.json`;
            if (fs.existsSync(stockPricesFile)) {
                market.stockPrices = JSON.parse(fs.readFileSync(stockPricesFile));
            }
        });
    }

    save() {
        const markets = this._markets.map(({ stockPrices, ...market }) => market);
        const stockPrices = this._markets.filter(market => market.stockPrices).map(({ symbol, stockPrices }) => ({ symbol, stockPrices }));

        fs.writeFileSync(marketsFile, JSON.stringify(markets));
        stockPrices.forEach(s => {
            const stockPricesFile = `${stockPricesFolder}/${s.symbol}.json`;
            fs.writeFileSync(stockPricesFile, JSON.stringify(s.stockPrices));
        });
    }

    get(symbol) {
        return this._markets.find(market => market.symbol === symbol);
    }

    getLatestData(symbol) {
        const market = this.get(symbol);
        return market.stockPrices[market.stockPrices.length - 1];
    }

    getTopMarkets(count, isGainer) {
        const marketsWithPrices = this._markets.filter(market => market.stockPrices && market.stockPrices.length > 0);

        return marketsWithPrices.sort((a, b) => (isGainer ? -1 : 1) * (a.stockPrices[a.stockPrices.length - 1].percentChange - b.stockPrices[b.stockPrices.length - 1].percentChange))
            .slice(0, count)
            .map(market => {
                const lastDay = market.stockPrices[market.stockPrices.length - 1];
                return {
                    symbol: market.symbol,
                    name: market.name,
                    percentChange: lastDay.percentChange,
                    valueChange: lastDay.valueChange,
                    currentPrice: lastDay.close
                };
            });
    }

    async fetchStockPrices(symbol) {
        const market = this.get(symbol);
    
        const latestFetch = market.latestFetch;
        const now = UTCTimestamp();
    
        if (!latestFetch || latestFetch < now) {
            try {
                const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${timestampToISO(latestFetch ? (latestFetch + 24 * 60 * 60 * 1000) : UTCTimestamp(365))}/${timestampToISO(now)}/?adjusted=true&sort=asc&limit=50000&apiKey=${process.env.POLYGON_API_KEY}`);
    
                if (response.ok) {
                    const data = await response.json();
    
                    if (!data.results) {
                        market.latestFetch = now;
                        this.save();
                        return [304, 'stock prices up to date'];
                    }
    
                    const previousClose = market.stockPrices && market.stockPrices.length > 0 ? market.stockPrices[market.stockPrices.length - 1].close : null;
    
                    const changes = data.results.map(({ c: close }, index, arr) => {
                        let previousPrice = index !== 0 ? arr[index - 1].c : previousClose;
                        if (previousPrice === null) {
                            return { percentChange: 0, valueChange: 0 };
                        }
    
                        let valueChange = close - previousPrice;
                        let percentChange = (valueChange / previousPrice) * 100;
    
                        return { percentChange, valueChange };
                    });
    
                    const stockPrices = data.results.map(({ o: open, c: close, h: high, l: low, t: timestamp }, index) => {
                        return { open, close, high, low, timestamp, ...changes[index] };
                    });
    
                    if (!market.stockPrices) { market.stockPrices = stockPrices; }
                    else { market.stockPrices.push(...stockPrices); }
    
                    market.latestFetch = now;
                    this.save();
    
                    return [200, 'stock prices fetched'];
                } else { return [response.status, response.statusText]; }
            } catch (error) {
                if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    return [408, 'Request Timeout'];
                } else {
                    return [500, 'Internal Server Error'];
                }
            }
        } else { return [304, 'stock prices up to date']; }
    }

    get markets() {
        return this._markets;
    }
}
