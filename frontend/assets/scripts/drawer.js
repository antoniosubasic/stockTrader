import endpoint from "./config.js";

function formatCurrency(value) {
    return value.toLocaleString("de-AT", {
        style: "currency",
        currency: "USD",
    });
}

export class Drawer {
    constructor(symbol) {
        this.symbol = symbol;
        this.marketDiv = document.getElementById("chart-box");
        this.canvasDiv = document.getElementById("chart-container");
        this.market;
        this.stockPrices;
        this.modal = new bootstrap.Modal(document.getElementById("modal"));
        this.modalBody = document.querySelector("#modal .modal-body .content");
    }

    async getMarket() {
        this.modalBody.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        this.modal.show();

        try {
            const response = await fetch(
                `${endpoint}/market?symbol=${this.symbol}`
            );

            if (response.ok) {
                this.market = await response.json();
                this.stockPrices = this.market.stockPrices;
                return true;
            } else if (response.status === 429) {
                // API data limit reached (too many requests)
                this.modalBody.innerHTML = `
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h4>Too many requests!</h4>
                    <p>
                        Sorry, you have reached the limit of requests for our free API at <a href="https://polygon.io/">Polygon.io</a>. We are currently waiting for the limit to reset. Please try again in a minute.
                    </p>
                `;

                await new Promise((resolve) => setTimeout(resolve, 60_000)); // 1 minute
                return await this.getMarket();
            } else {
                this.modalBody.innerHTML = `
                    <p class="error">${await response.text()}</p>
                `;
                return false;
            }
        } catch (error) {
            console.error(error);
            this.modalBody.innerHTML = `
                <p class="error">An error occurred: ${error.message}</p>
            `;
            return false;
        } finally {
            this.modal.hide();
        }
    }

    async drawMarket(inputDays = 22) {
        if (!this.market) {
            if (!(await this.getMarket())) {
                return;
            }
        }

        this.rearrangeDiv();

        let days = Math.min(this.stockPrices.length, inputDays);

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
                                    `Close: ${formatCurrency(
                                        stockPrice.close
                                    )}`,
                                    `Open: ${formatCurrency(stockPrice.open)}`,
                                    `High: ${formatCurrency(stockPrice.high)}`,
                                    `Low: ${formatCurrency(stockPrice.low)}`,
                                    `Value Change: ${formatCurrency(
                                        stockPrice.valueChange
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
        <span id="last-price">${formatCurrency(stockPrice.close)}</span>
        <span class="${stockPrice.valueChange >= 0 ? "green" : "red"}">${
            stockPrice.valueChange >= 0 ? "+" : ""
        }${formatCurrency(stockPrice.valueChange)}</span>
        <span class="${stockPrice.percentChange >= 0 ? "green" : "red"}">${
            stockPrice.valueChange >= 0 ? "+" : ""
        }${stockPrice.percentChange.toFixed(2)}%</span>
        `;
        this.marketDiv.appendChild(importantDataDiv);

        const dataDiv = document.createElement("div");
        dataDiv.id = "data";
        dataDiv.innerHTML = `
        <span><b>Open:</b> ${formatCurrency(stockPrice.open)}</span>
        <span><b>High:</b> ${formatCurrency(stockPrice.high)}</span>
        <span><b>Low:</b> ${formatCurrency(stockPrice.low)}</span>
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
            { days: 6, label: "1W" },
            { days: 11, label: "2W" },
            { days: 22, label: "1M" },
            { days: 43, label: "2M" },
            { days: 126, label: "6M" },
            { days: 251, label: "1Y" },
            { days: this.stockPrices.length, label: "All" },
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
        form.autocomplete = "off";
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
        inputButton.classList.add("btn", "btn-primary");
        form.appendChild(inputButton);

        customDayDiv.appendChild(form);

        this.marketDiv.appendChild(daysDiv);
        this.marketDiv.appendChild(customDayDiv);
    }
}
