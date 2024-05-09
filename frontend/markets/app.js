import endpoint from "../assets/scripts/config.js";

async function init() {
    const searchForm = document.getElementById("search-form");

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const symbol = searchForm.search.value;

        const marketDiv = document.getElementById("chart");
        const drawer = new Drawer(symbol, marketDiv);

        if (await drawer.getMarket()) {
            drawer.drawMarket(30);
        } else {
            console.error("failed to get market data");
        }
    });
}

document.addEventListener("DOMContentLoaded", init);

class Drawer {
    constructor(symbol, marketDiv) {
        this.symbol = symbol;
        this.marketDiv = marketDiv;
        this.market;
        this.stockPrices;

    }

    async getMarket() {
        const response = await fetch(
            `${endpoint}/market?symbol=${this.symbol}`
        );

        if (response.ok) {
            this.market = await response.json();
            this.stockPrices = this.market.stockPrices;
            return true;
        } else {
            console.error(await response.text());
            return false;
        }
    }

    drawMarket(days) {
        while (this.marketDiv.firstChild) {
            this.marketDiv.removeChild(this.marketDiv.firstChild);
        }
        const newCanvas = document.createElement("canvas");
        this.marketDiv.appendChild(newCanvas);

        const ctx = newCanvas.getContext("2d");

        const labels = this.stockPrices
            .map((stockPrice) =>
                new Date(stockPrice.timestamp).toLocaleDateString()
            )
            .slice(-days);

        const data = this.stockPrices
            .map((stockPrice) => stockPrice.close)
            .slice(-days);

        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: this.market.name,
                        data: data,
                        fill: false,
                        borderColor: "rgb(75, 192, 192)",
                        tension: 0.1,
                    },
                ],
            },
        });
    }
}
