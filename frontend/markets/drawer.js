import endpoint from "../assets/scripts/config.js";

export class Drawer {
    constructor(symbol) {
        this.symbol = symbol;
        this.marketDiv = document.getElementById("chart-box");
        this.canvasDiv = document.getElementById("chart-container");
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
        this.rearrangeDiv();

        const ctx = document.getElementById("chart-canvas").getContext("2d");

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

        this.createDayDiv();
    }

    rearrangeDiv() {
        Array.from(this.marketDiv.childNodes).forEach((child) => {
            this.marketDiv.removeChild(child);
        });
        Array.from(this.canvasDiv.childNodes).forEach((child) => {
            this.canvasDiv.removeChild(child);
        });

        const stockName = document.createElement("h2");
        stockName.textContent = `${this.market.name} (${this.market.symbol})`;
        stockName.id = "stock-name";
        this.marketDiv.appendChild(stockName);

        const importantDataDiv = document.createElement("div");
        importantDataDiv.id = "important-data";
        const stockPrice = this.stockPrices[this.stockPrices.length - 1];
        importantDataDiv.innerHTML = `
        <span id="last-price">${stockPrice.close.toFixed(2)}</span>
        <span class="${stockPrice.valueChange >= 0 ? "green" : "red"}">${
            stockPrice.valueChange >= 0 ? "+" : ""
        }${stockPrice.valueChange.toFixed(2)}</span>
        <span class="${
            stockPrice.percentChange >= 0 ? "green" : "red"
        }">(${stockPrice.percentChange.toFixed(2)}%)</span>
        `;
        this.marketDiv.appendChild(importantDataDiv);

        const dataDiv = document.createElement("div");
        dataDiv.id = "data";
        dataDiv.innerHTML = `
        <span><b>Open:</b> $${stockPrice.open.toFixed(2)}</span>
        <span><b>High:</b> $${stockPrice.high.toFixed(2)}</span>
        <span><b>Low:</b> $${stockPrice.low.toFixed(2)}</span>
        `;
        this.marketDiv.appendChild(dataDiv);

        const chartDiv = document.createElement("div");
        chartDiv.id = "chart";
        const newCanvas = document.createElement("canvas");
        newCanvas.id = "chart-canvas";
        chartDiv.appendChild(newCanvas);
        this.canvasDiv.appendChild(chartDiv);
        this.marketDiv.appendChild(this.canvasDiv);
    }

    createDayDiv() {
        const daysDiv = document.createElement("div");
        daysDiv.id = "days";

        const daysButtons = [
            { days: 7, label: "1 Week" },
            { days: 14, label: "2 Weeks" },
            { days: 30, label: "1 Month" },
            { days: 90, label: "3 Months" },
            { days: 180, label: "6 Months" },
            { days: 365, label: "1 Year" },
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

        const customDayDiv = document.createElement("div");
        customDayDiv.id = "custom-days-div";	
        const form = document.createElement("form");
        form.autocomplete="off";
        form.classList.add("d-flex");
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const days = document.getElementById("custom-days").value;
            if (days) {
                this.drawMarket(days);
            }
        });
        
        const input = document.createElement("input");
        input.classList.add("form-control", "me-2");
        input.type = "number";
        input.id = "custom-days";
        input.placeholder = "Enter days:";
        form.appendChild(input);
        
        const inputButton = document.createElement("button");
        inputButton.type = "submit";
        inputButton.textContent = "Go";
        inputButton.id = "custom-days-button";
        inputButton.classList.add("btn");
        form.appendChild(inputButton);

        customDayDiv.appendChild(form);

        this.marketDiv.appendChild(daysDiv);
        this.marketDiv.appendChild(customDayDiv);
    }
}
