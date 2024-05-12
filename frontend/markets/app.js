import endpoint from "../assets/scripts/config.js";

async function init() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const stockGainers = document.getElementById("stock-gainers");
    const stockLosers = document.getElementById("stock-losers");

    const gainers = await fetchMarkets(`${endpoint}/markets/gainers?count=5`);
    const losers = await fetchMarkets(`${endpoint}/markets/losers?count=5`);
    const markets = await fetchMarkets(`${endpoint}/markets`);

    const firstRow = `
    <div class="stock-item stock-item-display">
        <span class="stock-name stock-item-display">Symbol</span>
        <span class="stock-price">Price</span>
        <span class="stock-change">Change</span>
    </div>`;
    stockGainers.innerHTML += firstRow;
    stockLosers.innerHTML += firstRow;

    gainers.forEach((gainer) => {
        createStockDiv(gainer, stockGainers);
    });

    losers.forEach((loser) => {
        createStockDiv(loser, stockLosers);
    });

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        resultsDiv.innerHTML = "";
        const newDiv = document.createElement("div");
        if (value) {
            const filteredMarkets = markets.filter(
                (market) =>
                    market.symbol.toLowerCase().includes(value.toLowerCase()) ||
                    market.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
        
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
        
            if (newDiv.children.length === 0) {
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
        const marketDiv = document.getElementById("chart-container");
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

async function fetchMarkets(fetchUrl) {
    const response = await fetch(fetchUrl);
    if (response.ok) {
        return await response.json();
    } else {
        console.error(await response.text());
        return [];
    }
}

function createStockDiv(stock, container) {
    const stockDiv = document.createElement("div");
    stockDiv.classList.add("stock-item");

    const stockName = document.createElement("span");
    stockName.textContent = `${stock.symbol}`;
    stockName.classList.add("stock-name");

    const stockPrice = document.createElement("span");
    stockPrice.textContent = `$${stock.currentPrice.toFixed(2)}`;
    stockPrice.classList.add("stock-price");

    const stockChange = document.createElement("span");
    stockChange.textContent = `${stock.percentChange.toFixed(2)}%`;
    stockChange.classList.add(
        "stock-change",
        stock.percentChange >= 0 ? "green" : "red"
    );

    stockDiv.addEventListener("click", () => {
        performSearch(stock.symbol);
    });

    stockDiv.appendChild(stockName);
    stockDiv.appendChild(stockPrice);
    stockDiv.appendChild(stockChange);
    container.appendChild(stockDiv);
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

        const stockName = document.createElement("h2");
        stockName.textContent = `${this.market.name} (${this.market.symbol})`;
        stockName.id = "stock-name";
        this.marketDiv.appendChild(stockName);

        const importantDataDiv = document.createElement("div");
        importantDataDiv.id = "important-data";
        const stockPrice = this.stockPrices[this.stockPrices.length - 1];
        importantDataDiv.innerHTML = `
        <span id="last-price">${stockPrice.close.toFixed(2)}</span>
        <span class="${stockPrice.valueChange >= 0 ? "green" : "red"}">${stockPrice.valueChange >= 0 ? "+" : ""}${stockPrice.valueChange.toFixed(2)}</span>
        <span class="${stockPrice.percentChange >= 0 ? "green" : "red"}">(${stockPrice.percentChange.toFixed(2)}%)</span>
        `;
        this.marketDiv.appendChild(importantDataDiv);

        const dataDiv = document.createElement("div");
        dataDiv.id = "data";
        dataDiv.innerHTML = `
        <span><b>Open:</b> $ ${stockPrice.open.toFixed(2)}</span>
        <span><b>High:</b> $ ${stockPrice.high.toFixed(2)}</span>
        <span><b>Low:</b> $ ${stockPrice.low.toFixed(2)}</span>
        `;
        this.marketDiv.appendChild(dataDiv);

        const chartDiv = document.createElement("div");
        chartDiv.id = "chart";
        const newCanvas = document.createElement("canvas");
        chartDiv.appendChild(newCanvas);
        this.marketDiv.appendChild(chartDiv);

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
                                const index =
                                    this.stockPrices.length -
                                    days +
                                    context.dataIndex;
                                const stockPrice = this.stockPrices[index];
                                return [
                                    `Close: $ ${stockPrice.close.toFixed(2)}`,
                                    `Open: $ ${stockPrice.open.toFixed(2)}`,
                                    `High: $ ${stockPrice.high.toFixed(2)}`,
                                    `Low: $ ${stockPrice.low.toFixed(2)}`,
                                    `Value Change: $ ${stockPrice.valueChange.toFixed(
                                        2
                                    )}`,
                                    `Percent Change: ${stockPrice.percentChange.toFixed(
                                        2
                                    )}%`,
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

        const daysDiv = document.createElement("div");
        daysDiv.id = "days";

        const daysButtons = [
            { days: 7, label: '1 Week' },
            { days: 14, label: '2 Weeks' },
            { days: 30, label: '1 Month' },
            { days: 90, label: '3 Months' },
            { days: 180, label: '6 Months' },
            { days: 365, label: '1 Year' }
        ];
        
        daysButtons.forEach(({ days, label }) => {
            const button = document.createElement("button");
            button.classList.add("btn");
            button.classList.add("days-button");
            button.textContent = label;
            button.addEventListener("click", () => {
                this.drawMarket(days);
            });
            daysDiv.appendChild(button);
        });

        this.marketDiv.appendChild(daysDiv);
    }
}
