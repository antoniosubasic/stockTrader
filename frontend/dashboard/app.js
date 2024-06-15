import auth from "../assets/scripts/auth.js";
import endpoint from "../assets/scripts/config.js";
import { Drawer } from "../assets/scripts/drawer.js";

let marketSymbol;
let markets;
let modal;
let modalBody;

function formatCurrency(value) {
    return value.toLocaleString("de-AT", {
        style: "currency",
        currency: "USD",
    });
}

function formatTimestamp(timestamp, containsSeconds = false) {
    const date = new Date(timestamp);
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    };
    if (containsSeconds) {
        options.second = "2-digit";
    }
    return date.toLocaleDateString("de-AT", options);
}

function initTabSelectionHandler() {
    const buttons = document.querySelectorAll("#tab-selection button");
    let params = new URLSearchParams(window.location.search);

    buttons.forEach((button) => {
        button.addEventListener("click", async () => {
            buttons.forEach((b) => b.classList.remove("active"));
            button.classList.add("active");
            const display = button.getAttribute("data-display");

            params.set("display", display);
            window.history.replaceState(
                {},
                "",
                `${window.location.pathname}?${params}`
            );

            await loadContent(display);
        });
    });
}

async function loadContent(display) {
    const tabContent = document.getElementById("tab");
    const user = JSON.parse(localStorage.getItem("user"));

    switch (display) {
        case "stocks":
            await loadMyStocks(tabContent, user);
            break;

        case "transactions":
            tabContent.innerHTML = `
                ${
                    user.transactions.length > 0
                        ? `
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Transaction Type</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${user.transactions
                                .reverse()
                                .map(
                                    (stock) =>
                                        `<tr><th scope="row">${
                                            stock.symbol
                                        }</th><td><p class="${
                                            stock.type === "BUY"
                                                ? "green"
                                                : "red"
                                        }">${
                                            stock.type
                                        }</p></td><td>${formatCurrency(
                                            stock.price
                                        )}</td><td>${
                                            stock.quantity
                                        }</td><td>${formatTimestamp(
                                            stock.timestamp,
                                            true
                                        )}</td></tr>`
                                )
                                .join("")}
                        </tbody>
                    </table>
                `
                        : '<p class="red">You don\'t have any transactions</p>'
                }
            `;
            break;

        case "buy-stocks":
            tabContent.innerHTML = `
                <div id="searchBar">
                    <div>
                        <form
                            class="d-flex"
                            role="search"
                            id="search-form"
                            autocomplete="off"
                        >
                            <input
                                class="form-control me-2"
                                type="search"
                                placeholder="Search..."
                                aria-label="Search"
                                id="search"
                                required
                            />
                            <button class="btn btn-primary" type="submit">Search</button>
                        </form>
                        <div id="results"></div>
                    </div>
                </div>
            `;
            await initSearchBarHandler();
            break;

        case "sell-stocks":
            await loadSellStocks(tabContent, user);
            if (user.currentStocks.length > 0) {
                await initSellStocksHandler();
            }
            break;
    }
}

async function initSearchBarHandler() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        filterAndDisplayMarkets(value, resultsDiv, searchForm);
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

        searchForm.search.value = market.name;
        marketSymbol = market.symbol;

        await initBuyFormHandler();
    });
}

function filterAndDisplayMarkets(value, resultsDiv, searchForm) {
    resultsDiv.innerHTML = "";
    const newDiv = document.createElement("div");
    if (value) {
        const filteredMarkets = markets
            .filter(
                (market) =>
                    market.symbol.toLowerCase().includes(value.toLowerCase()) ||
                    market.name.toLowerCase().includes(value.toLowerCase())
            )
            .slice(0, 5);

        filteredMarkets.forEach((market) => {
            const resultItem = document.createElement("p");
            resultItem.classList.add("result-item");
            resultItem.textContent = `${market.name} (${market.symbol})`;

            resultItem.addEventListener("click", async () => {
                searchForm.search.value = market.name;
                marketSymbol = market.symbol;
                resultsDiv.innerHTML = "";

                await initBuyFormHandler();
            });
            newDiv.appendChild(resultItem);
        });

        if (newDiv.children.length === 0) {
            resultsDiv.innerHTML = `<div><p class="result-item">No results</p></div>`;
        } else {
            resultsDiv.appendChild(newDiv);
        }
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

async function initBuyFormHandler() {
    if (marketSymbol) {
        modalBody.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        modal.show();

        const response = await fetch(
            `${endpoint}/market?symbol=${marketSymbol}`
        );
        const market = await response.json();
        modal.hide();

        const maxBuy = Math.floor(
            (JSON.parse(localStorage.getItem("user")).balance - 25) /
                market.stockPrices[market.stockPrices.length - 1].close
        );

        document.getElementById("tab").innerHTML = `
            <div class="w-75">
                <table class="table quantity-table">
                    <thead>
                        <tr>
                            <th>Market</th>
                            <th>Price</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">${market.name}</th>
                            <td>${formatCurrency(
                                market.stockPrices[
                                    market.stockPrices.length - 1
                                ].close
                            )}</td>
                            <td><input id="buy-stocks-quantity" type="number" min="1" max="${maxBuy}"> / ${maxBuy}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-primary" id="buy-stocks-button">Buy</button>
            <div id="chart-box">
                <div id="chart-container"></div>
            </div>
        `;

        const drawer = new Drawer(marketSymbol);
        await drawer.drawMarket();

        document
            .getElementById("buy-stocks-button")
            .addEventListener("click", async (e) => {
                const quantity = parseInt(
                    document.getElementById("buy-stocks-quantity").value
                );

                if (!quantity || quantity <= 0) {
                    modalBody.innerHTML = `<p class="red">Invalid quantity</p>`;
                    modal.show();
                } else {
                    if (marketSymbol) {
                        const response = await fetch(
                            `${endpoint}/market/buy?symbol=${marketSymbol}&quantity=${quantity}`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${localStorage.getItem(
                                        "jwt"
                                    )}`,
                                },
                            }
                        );

                        if (response.ok) {
                            const json = await response.json();
                            localStorage.setItem("user", JSON.stringify(json));
                            window.location.reload();
                        } else {
                            modalBody.innerHTML = `<p class="red">${await response.text()}</p>`;
                            modal.show();
                        }
                    }
                }
            });

            
    }
}

async function initSellStocksHandler() {
    document
        .getElementById("sell-button")
        .addEventListener("click", async () => {
            const table = document.querySelector(".sell-stocks-table");
            const rows = table.querySelectorAll(".sell-stocks-table tbody tr");

            const sellData = [];
            let error = false;

            rows.forEach((row) => {
                const input = row.querySelector("input");
                const quantity = input.value ? parseInt(input.value) : 0;
                const max = parseInt(input.getAttribute("max"));

                if (quantity > 0 && quantity <= max) {
                    sellData.push({
                        symbol: row.getAttribute("data-symbol"),
                        quantity,
                    });
                } else if (quantity > max) {
                    error = true;
                    input.classList.add("red");
                }
            });

            if (error) {
                modalBody.innerHTML = `<p class="red">Invalid quantity</p>`;
                modal.show();
                return;
            }

            if (sellData.length > 0) {
                const response = await fetch(`${endpoint}/market/sell`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                    },
                    body: JSON.stringify(sellData),
                });

                if (response.ok) {
                    const json = await response.json();
                    localStorage.setItem("user", JSON.stringify(json));
                    window.location.reload();
                } else {
                    modalBody.innerHTML = `<p class="red">${await response.text()}</p>`;
                    modal.show();
                }
            }
        });
}

async function loadMyStocks(tabContent, user) {
    modalBody.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>`;
    modal.show();

    if (user.currentStocks.length <= 0) {
        tabContent.innerHTML = `<p class="red">You don\'t own any stocks</p>`;
        modal.hide();
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    table.classList.add("table", "table-striped", "buy-stocks-table");

    thead.innerHTML = `
        <tr>
            <th scope="col">Market</th>
            <th scope="col">Purchase Price</th>
            <th scope="col">Current Price</th>
            <th scope="col">Yesterday's Change</th>
            <th scope="col">Development</th>
            <th scope="col">Quantity</th>
        </tr>
        `;

    for (const stock of user.currentStocks) {
        await generateMyStockTable(stock, tbody);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tabContent.innerHTML = "";
    tabContent.appendChild(table);

    modal.hide();
}

async function generateMyStockTable(stock, tbody) {
    const response = await fetch(
        `${endpoint}/market/latest?symbol=${stock.symbol}`
    );

    if (response.status === 429) {
        modalBody.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4>Too many requests!</h4>
            <p>
                Sorry, you have reached the limit of requests for our free API at <a href="https://polygon.io/">Polygon.io</a>. We are currently waiting for the limit to reset. Please try again in a minute.
            </p>
        `;

        await new Promise((resolve) => setTimeout(resolve, 60_000)); // 1 minute
        return generateMyStockTable(stock, tbody);
    } else if (!response.ok) {
        console.error(await response.text());
        return;
    }

    const market = await response.json();

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <th scope="row"><span>${
            stock.symbol
        }</span><br><span class="market-name">${
        markets.find((m) => m.symbol === stock.symbol).name
    }</span></th>
        <td>${formatCurrency(stock.averagePrice)}</td>
        <td>${formatCurrency(market.close)}</td>
        <td><span class="${market.valueChange > 0 ? "green" : "red"}"
        >${market.percentChange > 0 ? "+" : ""}${formatCurrency(
        market.valueChange
    )}</span><br><span class="${market.percentChange > 0 ? "green" : "red"}"
        >${market.percentChange > 0 ? "+" : ""}${market.percentChange.toFixed(
        2
    )}%</span></td>
    <td><span>${
        market.close > stock.averagePrice
            ? `<span class="green">+${formatCurrency(
                  market.close - stock.averagePrice
              )}</span>`
            : market.close === stock.averagePrice
            ? `<span>${formatCurrency(0)}</span>`
            : `<span class="red">${formatCurrency(
                  market.close - stock.averagePrice
              )}</span>`
    }</span><br><span>${
        market.close > stock.averagePrice
            ? `<span class="green">+${(
                  ((market.close - stock.averagePrice) * 100) /
                  stock.averagePrice
              ).toFixed(2)}%</span>`
            : market.close === stock.averagePrice
            ? `<span>0.00%</span>`
            : `<span class="red">${(
                  ((market.close - stock.averagePrice) * 100) /
                  stock.averagePrice
              ).toFixed(2)}%</span>`
    }</span></td>
        <td><span>${formatCurrency(
            stock.quantity * market.close
        )}</span><br><span>${stock.quantity} stocks</span></td>
    `;

    tbody.appendChild(tr);
}

async function loadSellStocks(tabContent, user) {
    modalBody.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>`;
    modal.show();

    if (user.currentStocks.length <= 0) {
        tabContent.innerHTML = `<p class="red">You don\'t own any stocks</p>`;
        modal.hide();
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    table.classList.add(
        "table",
        "table-striped",
        "sell-stocks-table",
        "w-75",
        "quantity-table"
    );

    thead.innerHTML = `
    <tr>
        <th scope="col">Market</th>
        <th scope="col">Current Price</th>
        <th scope="col">Development</th>
        <th scope="col">Quantity</th>
    </tr>
    `;

    for (const stock of user.currentStocks) {
        await generateSellStockTable(stock, tbody);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tabContent.innerHTML = "";
    tabContent.appendChild(table);

    tabContent.innerHTML += `
        <div>
            <button class="btn btn-primary" id="sell-button">Sell</button>
        </div>`;

    modal.hide();
}

async function generateSellStockTable(stock, tbody) {
    const response = await fetch(
        `${endpoint}/market/latest?symbol=${stock.symbol}`
    );

    if (response.status === 429) {
        modalBody.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4>Too many requests!</h4>
            <p>
                Sorry, you have reached the limit of requests for our free API at <a href="https://polygon.io/">Polygon.io</a>. We are currently waiting for the limit to reset. Please try again in a minute.
            </p>
        `;

        await new Promise((resolve) => setTimeout(resolve, 60_000)); // 1 minute
        return await generateSellStockTable(stock, tbody);
    } else if (!response.ok) {
        console.error(await response.text());
        return;
    }

    const market = await response.json();

    const tr = document.createElement("tr");
    tr.setAttribute("data-symbol", stock.symbol);
    tr.innerHTML = `
        <th scope="row"><span>${stock.symbol}</span><br>
        <span class="market-name">${
            markets.find((m) => m.symbol === stock.symbol).name
        }</span></th>
        <td>${formatCurrency(market.close)}</td>
        <td><span>${
            market.close > stock.averagePrice
                ? `<span class="green">+${formatCurrency(
                      market.close - stock.averagePrice
                  )}</span>`
                : market.close === stock.averagePrice
                ? `<span>${formatCurrency(0)}</span>`
                : `<span class="red">${formatCurrency(
                      market.close - stock.averagePrice
                  )}</span>`
        }</span><br><span>${
        market.close > stock.averagePrice
            ? `<span class="green">+${(
                  ((market.close - stock.averagePrice) * 100) /
                  stock.averagePrice
              ).toFixed(2)}%</span>`
            : market.close === stock.averagePrice
            ? `<span>0.00%</span>`
            : `<span class="red">${(
                  ((market.close - stock.averagePrice) * 100) /
                  stock.averagePrice
              ).toFixed(2)}%</span>`
    }</span></td>
        <td><input type="number" min="1" max="${stock.quantity}"> / ${
        stock.quantity
    }</td>`;

    tbody.appendChild(tr);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!(await auth())) {
        window.location.href = "../signIn";
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    markets = await fetchMarkets(`${endpoint}/markets`);
    modal = new bootstrap.Modal(document.getElementById("modal"));
    modalBody = document.querySelector("#modal .modal-body .content");
    const closeButton = document.querySelector('#modal .btn-close');

    closeButton.addEventListener('click', () => {
        modal.hide();
    });

    document.getElementById("share-in-stocks-value").innerText = formatCurrency(
        user.transactions
            ? user.currentStocks.reduce(
                  (sum, stock) => sum + stock.quantity * stock.averagePrice,
                  0
              )
            : 0
    );
    document.getElementById("balance-value").innerText = formatCurrency(
        user.balance
    );

    const params = new URLSearchParams(window.location.search);
    const display = params.get("display");

    if (display) {
        const buttons = document.querySelectorAll("#tab-selection button");
        const button = [...buttons].find(
            (b) => b.getAttribute("data-display") === display
        );
        button.classList.add("active");
        await loadContent(display);
    }

    initTabSelectionHandler();
});
