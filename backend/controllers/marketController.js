import fs from 'fs';

const marketsFile = './data/markets.json';
const apiKeyFile = './data/apikey';

const dateToISO = date => date.toISOString().split('T')[0];

export class Controller {
    _markets = null;
    _apiKey = null;

    constructor() {
        this._markets = JSON.parse(fs.readFileSync(marketsFile));
        this._apiKey = fs.readFileSync(apiKeyFile);
    }

    save() {
        fs.writeFileSync(marketsFile, JSON.stringify(this._markets));
    }

    get(symbol = null) {
        return symbol ? this._markets.find(market => market.symbol === symbol) : this._markets;
    }

    async fetch(symbol, daysAgo) {
        const end = new Date();
        end.setDate(end.getDate() + 1);

        const start = new Date();
        start.setDate(end.getDate() - daysAgo);

        const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${dateToISO(start)}/${dateToISO(end)}/?adjusted=true&sort=asc&limit=50000&apiKey=${this._apiKey}`);
        const data = await response.json();

        const stockPrices = data.results.map(({ o: open, c: close, h: high, l: low, t: timestamp }) => ({ open, close, high, low, timestamp }));
        this.get(symbol).stockPrices = stockPrices;
        this.save();
    }
}
