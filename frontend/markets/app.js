import endpoint from "../assets/scripts/config.js";
import { Drawer } from "./drawer.js";

async function init() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const toggleButton = document.getElementById("toggle-btn");

    const markets = await fetchMarkets(`${endpoint}/markets`);

    await updateStocks();

    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol') || "NVDA";
    performSearch(symbol);

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

    toggleButton.addEventListener("click", () => {
        handleToggleButton();
    });
}

async function performSearch(symbol) {
    if (symbol !== "") {
        const drawer = new Drawer(symbol);
        await drawer.drawMarket();

        await updateStocks();

        window.history.pushState({}, '', `?symbol=${symbol}`);
    } else {
        console.error("market not found");
    }
}

function handleToggleButton() {
    const bar = $("#stock-div");
    const toggleButton = $("#toggle-btn");
    const chartContainer = $("#chart-container");

    if (bar.width() > 0) {
        bar.animate({ width: '0' }, 500, function() {
            bar.hide();
            toggleButton.text(">");
        });
        chartContainer.animate({ height: '80vh', width: '85vw' }, 500);
    } else {
        bar.css('width', '0').show().animate({ width: '100%' }, 500, function() {
            toggleButton.text("<");
        });
        chartContainer.animate({ height: '70vh', width: '75vw' }, 500);
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

async function updateStocks() {
    const stockGainers = document.getElementById("stock-gainers");
    const stockLosers = document.getElementById("stock-losers");

    stockGainers.innerHTML = "<h4>Stock Gainers</h4>";
    stockLosers.innerHTML = "<h4>Stock Losers</h4>";

    const firstRow = `
    <div class="stock-item stock-item-display">
        <span class="stock-name">Symbol</span>
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