import { Controller as MarketController } from "../controllers/marketController.js";

const marketController = new MarketController();

export class Market {
    _symbol;

    constructor(symbol) {
        this._symbol = symbol;
    }

    async get() {
        const markets = marketController.markets;

        if (!markets.find((market) => market.symbol === this._symbol)) {
            return [null, [404, "market not found"]];
        }

        const [responseCode, responseMessage] =
            await marketController.fetchStockPrices(this._symbol);

        return responseCode !== 200 && responseCode !== 304
            ? [null, [responseCode, responseMessage]]
            : [
                  marketController.get(this._symbol),
                  [200, "market data retrieved"],
              ];
    }

    async getLatestData() {
        const markets = marketController.markets;

        if (!markets.find((market) => market.symbol === this._symbol)) {
            return [null, [404, "market not found"]];
        }

        const [responseCode, responseMessage] =
            await marketController.fetchStockPrices(this._symbol);

        return responseCode !== 200 && responseCode !== 304
            ? [null, [responseCode, responseMessage]]
            : [
                  marketController.getLatestData(this._symbol),
                  [200, "market data retrieved"],
              ];
    }
}

export class Markets {
    static getAll() {
        return marketController.markets.map(({ symbol, name }) => ({
            symbol,
            name,
        }));
    }

    static getTopGainers(count) {
        return marketController.getTopMarkets(count, true);
    }

    static getTopLosers(count) {
        return marketController.getTopMarkets(count, false);
    }
}
