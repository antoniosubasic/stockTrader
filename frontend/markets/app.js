import endpoint from "../assets/scripts/config.js";
import { Drawer } from "./drawer.js";

async function init() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");

    const markets = await fetchMarkets(`${endpoint}/markets`);

    await updateStocks(endpoint);

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        filterAndDisplayMarkets(value, resultsDiv, searchForm, markets);
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
        const drawer = new Drawer(symbol);

        if (await drawer.getMarket()) {
            await updateStocks(endpoint);
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

async function updateStocks(endpoint) {
    const stockGainers = document.getElementById("stock-gainers");
    const stockLosers = document.getElementById("stock-losers");

    stockGainers.innerHTML = "<h3>Stock Gainers</h3>";
    stockLosers.innerHTML = "<h3>Stock Losers</h3>";

    const firstRow = `
    <div class="stock-item stock-item-display">
        <span class="stock-name stock-item-display">Symbol</span>
        <span class="stock-price">Price</span>
        <span class="stock-change-value">Change</span>
        <span class="stock-change-percent">%Change</span>
    </div>`;
    stockGainers.innerHTML += firstRow;
    stockLosers.innerHTML += firstRow;

    const gainers = await fetchMarkets(`${endpoint}/markets/gainers?count=7`);
    const losers = await fetchMarkets(`${endpoint}/markets/losers?count=7`);

    gainers.forEach((gainer) => {
        createStockDiv(gainer, stockGainers);
    });

    losers.forEach((loser) => {
        createStockDiv(loser, stockLosers);
    });
}

function createStockDiv(stock, container) {
    const stockDiv = document.createElement("div");
    stockDiv.classList.add("stock-item");

    const stockName = document.createElement("span");
    stockName.textContent = `${stock.symbol}`;
    stockName.classList.add("stock-name");

    const stockPrice = document.createElement("span");
    stockPrice.textContent = `${stock.currentPrice.toFixed(2)}`;
    stockPrice.classList.add("stock-price");

    const stockChangeValue = document.createElement("span");
    stockChangeValue.textContent = `${
        stock.valueChange >= 0 ? "+" : ""
    }${stock.valueChange.toFixed(2)}`;
    stockChangeValue.classList.add(
        "stock-change-value",
        stock.valueChange >= 0 ? "green" : "red"
    );

    const stockChangePercent = document.createElement("span");
    stockChangePercent.textContent = `${
        stock.valueChange >= 0 ? "+" : ""
    }${stock.percentChange.toFixed(2)}%`;
    stockChangePercent.classList.add(
        "stock-change-percent",
        stock.percentChange >= 0 ? "green" : "red"
    );

    stockDiv.addEventListener("click", () => {
        const searchForm = document.getElementById("search-form");
        searchForm.search.value = `${stock.name}`;

        performSearch(stock.symbol);
    });

    stockDiv.appendChild(stockName);
    stockDiv.appendChild(stockPrice);
    stockDiv.appendChild(stockChangeValue);
    stockDiv.appendChild(stockChangePercent);
    container.appendChild(stockDiv);
}

function filterAndDisplayMarkets(value, resultsDiv, searchForm, markets) {
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
}

document.addEventListener("DOMContentLoaded", init);
