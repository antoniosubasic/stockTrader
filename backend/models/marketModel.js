import { Controller as MarketController } from '../controllers/marketController.js';

const marketController = new MarketController();

export class Market {
    _symbol;

    constructor(symbol) {
        this._symbol = symbol;
    }

    async get() {
        const markets = marketController.markets;

        if (!markets.find(market => market.symbol === this._symbol)) {
            return [null, [404, 'market not found']];
        }

        const market = marketController.get(this._symbol);

        if (!market.stockPrices || (market.stockPrices[market.stockPrices.length - 1].timestamp + 86_400_000 * 2) < new Date()) {
            await marketController.fetchStockPrices(this._symbol, 365);
        }

        return [marketController.get(this._symbol), [200, 'market data retrieved']];
    }
}
