import endpoint from "../assets/scripts/config.js";

async function init() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");

    const response = await fetch(`${endpoint}/markets`);
    let markets;
    if (response.ok) {
        markets = await response.json();
    }

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        resultsDiv.innerHTML = "";
        const newDiv = document.createElement("div");
        if (value) {
            const filteredMarkets = markets.filter(
                (market) =>
                    market.symbol.toLowerCase().includes(value.toLowerCase()) ||
                    market.name.toLowerCase().includes(value.toLowerCase())
            );
            filteredMarkets.forEach((market) => {
                const resultItem = document.createElement("p");
                resultItem.classList.add("result-item");
                resultItem.textContent = `${market.name} (${market.symbol})`;

                resultItem.addEventListener("click", () => {
                    searchForm.search.value = `${market.name}`;
                    resultsDiv.innerHTML = "";
                    performSearch(market.symbol);
                });

                newDiv.appendChild(resultItem);
            });

            if (newDiv.children.length > 10) {
                resultsDiv.innerHTML = `<div><p class="result-item">Too many results</p></div>`;
            } else if (newDiv.children.length === 0) {
                resultsDiv.innerHTML = `<div><p class="result-item">No results</p></div>`;
            } else {
                resultsDiv.appendChild(newDiv);
            }
        }
    });

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const enteredValue = searchForm.search.value;
        resultsDiv.innerHTML = "";
        const market = markets.find(
            (m) =>
                m.name.toLowerCase() === enteredValue.toLowerCase() ||
                m.symbol.toLowerCase() === enteredValue.toLowerCase()
        );
        const symbol = market ? market.symbol : "";
        searchForm.search.value = `${market.name}`;

        performSearch(symbol);
    });
}

async function performSearch(symbol) {
    if (symbol !== "") {
        const marketDiv = document.getElementById("chart");
        const drawer = new Drawer(symbol, marketDiv);

        if (await drawer.getMarket()) {
            drawer.drawMarket(30);
        } else {
            console.error("failed to get market data");
        }
    } else {
        console.error("market not found");
    }
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
                new Date(stockPrice.timestamp).toLocaleDateString("de-AT", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                })
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
                    },
                ],
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                const stockPrice = this.stockPrices[index];
                                return [
                                    `Open: $${stockPrice.open}`,
                                    `Close: $${stockPrice.close}`,
                                    `High: $${stockPrice.high}`,
                                    `Low: $${stockPrice.low}`,
                                ];
                            }.bind(this),
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value, index, ticks) {
                                return `$${value.toFixed(2)}`;
                            },
                        },
                    },
                },
            },
        });
    }
}
