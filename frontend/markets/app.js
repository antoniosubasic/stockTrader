import endpoint from "../assets/scripts/config.js";
import { Drawer } from "../assets/scripts/drawer.js";
import auth from "../assets/scripts/auth.js";

let modal;
let modalContent;

async function init() {
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const toggleButton = document.getElementById("toggle-btn");

    const markets = await fetchMarkets(`${endpoint}/markets`);

    modal = new bootstrap.Modal(document.getElementById("modal"));
    modalContent = document.querySelector("#modal .modal-body .content");

    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get("symbol");
    let market = markets.find((m) => m.symbol === symbol);
    if (market) {
        await performSearch(market.symbol, market.name);
    } else if (await auth()) {
        let user = JSON.parse(localStorage.getItem("user"));
        market = markets.find((m) => m.symbol === user.favoriteStock);
        await performSearch(market.symbol, market.name);
    } else {
        market = markets.find((m) => m.symbol === "NVDA");
        await performSearch(market.symbol, market.name);
    }

    searchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        filterAndDisplayMarkets(value, resultsDiv, markets);
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

        if (market) {
            await performSearch(market.symbol, market.name);
        } else {
            console.error("market not found");
        }
    });

    toggleButton.addEventListener("click", () => {
        handleToggleButton();
    });
}

function formatCurrency(value) {
    return value.toLocaleString("de-AT", {
        style: "currency",
        currency: "USD",
    });
}

async function performSearch(symbol, marketName) {
    if (symbol !== "") {
        const drawer = new Drawer(symbol);
        await drawer.drawMarket();

        await updateStocks();

        const searchForm = document.getElementById("search-form");

        window.history.pushState({}, "", `?symbol=${symbol}`);
        searchForm.search.value = marketName;

        let recentViewed =
            JSON.parse(localStorage.getItem("recentViewed")) || [];
        let existingIndex = recentViewed.findIndex(
            (item) => item.symbol === symbol
        );
        if (existingIndex !== -1) {
            recentViewed.splice(existingIndex, 1);
        }
        recentViewed.unshift({ symbol, name: marketName });
        while (recentViewed.length > 5) {
            recentViewed.pop();
        }
        localStorage.setItem("recentViewed", JSON.stringify(recentViewed));

        await updateRecentViewed();
    } else {
        console.error("market not found");
    }
}

function handleToggleButton() {
    const bar = $("#stock-div");
    const toggleButton = $("#toggle-btn");
    const chartContainer = $("#chart-container");

    if (bar.width() > 0) {
        bar.animate({ width: "0" }, 500, function () {
            bar.hide();
            toggleButton.text("<");
        });
        chartContainer.animate({ height: "80vh", width: "85vw" }, 500);
    } else {
        bar.css("width", "0")
            .show()
            .animate({ width: "100%" }, 500, function () {
                toggleButton.text(">");
            });
        chartContainer.animate({ height: "70vh", width: "75vw" }, 500);
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

    stockGainers.innerHTML =
        '<h6 id="gainers-heading">Stock Gainers <span>><span></h6>';
    stockLosers.innerHTML =
        '<h6 id="losers-heading">Stock Losers <span>><span></h6>';

    const stockGainersInnerDiv = document.createElement("div");
    stockGainersInnerDiv.id = "stock-gainers-inner";
    stockGainers.appendChild(stockGainersInnerDiv);

    const stockLosersInnerDiv = document.createElement("div");
    stockLosersInnerDiv.id = "stock-losers-inner";
    stockLosers.appendChild(stockLosersInnerDiv);

    const firstRow = `
    <div class="stock-item stock-item-display">
        <span class="stock-name">Symbol</span>
        <span class="stock-price">Price</span>
        <span class="stock-change-value">Change</span>
        <span class="stock-change-percent">%Change</span>
    </div>`;
    stockGainersInnerDiv.innerHTML += firstRow;
    stockLosersInnerDiv.innerHTML += firstRow;

    const gainers = await fetchMarkets(`${endpoint}/markets/gainers?count=7`);
    const losers = await fetchMarkets(`${endpoint}/markets/losers?count=7`);

    gainers.forEach((gainer) => {
        createStockDiv(gainer, stockGainersInnerDiv);
    });

    losers.forEach((loser) => {
        createStockDiv(loser, stockLosersInnerDiv);
    });

    addEventListenerToHeadings("gainers-heading", "stock-gainers-inner");
    addEventListenerToHeadings("losers-heading", "stock-losers-inner");
}

function createStockDiv(stock, container) {
    const stockDiv = document.createElement("div");
    stockDiv.classList.add("stock-item");

    const stockName = document.createElement("span");
    stockName.textContent = `${stock.symbol}`;
    stockName.classList.add("stock-name");

    const stockPrice = document.createElement("span");
    stockPrice.textContent = `${formatCurrency(stock.currentPrice)}`;
    stockPrice.classList.add("stock-price");

    const stockChangeValue = document.createElement("span");
    stockChangeValue.textContent = `${
        stock.valueChange >= 0 ? "+" : ""
    }${formatCurrency(stock.valueChange)}`;
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

    stockDiv.addEventListener("click", async () => {
        await performSearch(stock.symbol, stock.name);
    });

    stockDiv.appendChild(stockName);
    stockDiv.appendChild(stockPrice);
    stockDiv.appendChild(stockChangeValue);
    stockDiv.appendChild(stockChangePercent);
    container.appendChild(stockDiv);
}

function filterAndDisplayMarkets(value, resultsDiv, markets) {
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
                await performSearch(market.symbol, market.name);
                resultsDiv.innerHTML = "";
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

async function updateRecentViewed() {
    const recentViewedDiv = document.getElementById("recent-viewed");
    recentViewedDiv.innerHTML =
        '<h6 id="viewed-heading">Recently Viewed <span>><span></h6>';

    const recentViewedInnerDiv = document.createElement("div");
    recentViewedInnerDiv.id = "recent-viewed-inner";
    recentViewedDiv.appendChild(recentViewedInnerDiv);

    const firstRow = `
    <div class="stock-item stock-item-display">
        <span class="stock-name">Symbol</span>
        <span class="stock-price">Price</span>
        <span class="stock-change-value">Change</span>
        <span class="stock-change-percent">%Change</span>
    </div>`;
    recentViewedInnerDiv.innerHTML += firstRow;

    const recentViewed = JSON.parse(localStorage.getItem("recentViewed")) || [];

    for (const item of recentViewed) {
        const response = await fetch(
            `${endpoint}/market/latest?symbol=${item.symbol}`
        );

        if (response.status === 429) {
            modalContent.innerHTML = `
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4>Too many requests!</h4>
                <p>
                    Sorry, you have reached the limit of requests for our free API at <a href="https://polygon.io/">Polygon.io</a>. We are currently waiting for the limit to reset. Please try again in a minute.
                </p>
                `;
            modal.show();

            await new Promise((resolve) => setTimeout(resolve, 60_000)); // 1 minute
            return await updateRecentViewed();
        } else if (!response.ok) {
            console.error(await response.text());
            return;
        }

        const market = await response.json();

        createStockDiv(
            {
                symbol: item.symbol,
                name: item.name,
                currentPrice: market.close,
                valueChange: market.valueChange,
                percentChange: market.percentChange,
            },
            recentViewedInnerDiv
        );
    }

    addEventListenerToHeadings("viewed-heading", "recent-viewed-inner");

    modal.hide();
}

function animateDiv(divId) {
    const div = $(`#${divId}`);

    if (div.is(":visible")) {
        div.slideUp(500);
    } else {
        div.slideDown(500);
    }
}

function addEventListenerToHeadings(headingId, divId) {
    const heading = document.getElementById(headingId);

    heading.addEventListener("click", () => {
        animateDiv(divId);
        const span = heading.querySelector("span");
        span.textContent = span.textContent === ">" ? "<" : ">";
    });
}

document.addEventListener("DOMContentLoaded", init);
