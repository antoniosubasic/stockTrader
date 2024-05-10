import fs from 'fs';

const marketsFile = './data/markets.json';
const apiKeyFile = './data/apikey';
const stockPricesFolder = './data/stockPrices';

const timestampToISO = timestamp => new Date(timestamp).toISOString().split('T')[0];
const UTCTimestamp = (daysAgo = null) => {
    const now = new Date();
    const ago = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (daysAgo || 0));
    return Date.UTC(ago.getUTCFullYear(), ago.getUTCMonth(), ago.getUTCDate());
}

export class Controller {
    _markets = null;
    _apiKey = null;

    constructor() {
        this._apiKey = fs.readFileSync(apiKeyFile);
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

    async fetchStockPrices(symbol) {
        const market = this.get(symbol);

        const latestFetch = market.latestFetch;
        const now = UTCTimestamp();

        if (!latestFetch || latestFetch < now) {
            const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${timestampToISO(latestFetch ? (latestFetch + 24 * 60 * 60 * 1000) : UTCTimestamp(365))}/${timestampToISO(now)}/?adjusted=true&sort=asc&limit=50000&apiKey=${this._apiKey}`);

            if (response.ok) {
                const data = await response.json();
                const previousClose = market.stockPrices && market.stockPrices.length > 0 ? market.stockPrices[market.stockPrices.length - 1].close : null;

                const percentChanges = data.results.map(({ c: close }, index, arr) => {
                    let percentChange;
                    if (index !== 0) {
                        percentChange = ((close - arr[index - 1].c) / arr[index - 1].c) * 100;
                    } else if (previousClose !== null) {
                        percentChange = ((close - previousClose) / previousClose) * 100;
                    } else {
                        percentChange = 0;
                    }
                    return percentChange;
                });

                const stockPrices = data.results.map(({ o: open, c: close, h: high, l: low, t: timestamp }, index) => {
                    return { open, close, high, low, timestamp, percentChange: percentChanges[index] };
                });
    
                if (!market.stockPrices) { market.stockPrices = stockPrices; }
                else { market.stockPrices.push(...stockPrices); }

                market.latestFetch = now;
                this.save();

                return [200, 'stock prices fetched'];
            } else { return [response.status, response.statusText]; }
        } else { return [304, 'stock prices up to date']; }
    }

    get markets() {
        return this._markets;
    }
}
