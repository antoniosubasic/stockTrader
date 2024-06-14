import { Drawer } from "./assets/scripts/drawer.js";
import endpoint from "./assets/scripts/config.js";

async function init() {
    const drawer = new Drawer("AAPL");
    await drawer.drawMarket();

    await updateStocks();
}

async function updateStocks() {
    const stockGainers = document.getElementById("stock-gainers");
    const stockLosers = document.getElementById("stock-losers");

    stockGainers.innerHTML = "<h3>Stock Gainers</h3>";
    stockLosers.innerHTML = "<h3>Stock Losers</h3>";

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

    const gainers = await fetchMarkets(`${endpoint}/markets/gainers?count=10`);
    const losers = await fetchMarkets(`${endpoint}/markets/losers?count=10`);

    gainers.forEach((gainer) => {
        createStockDiv(gainer, stockGainersInnerDiv);
    });

    losers.forEach((loser) => {
        createStockDiv(loser, stockLosersInnerDiv);
    });
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
        // How to navigate to the markets page with the stock symbol as URLSearchParams
        console.log(window.location.pathname);
        window.location.href = `./markets?symbol=${stock.symbol}`;
    });

    stockDiv.appendChild(stockName);
    stockDiv.appendChild(stockPrice);
    stockDiv.appendChild(stockChangeValue);
    stockDiv.appendChild(stockChangePercent);
    container.appendChild(stockDiv);
}

function formatCurrency(value) {
    return value.toLocaleString("de-AT", {
        style: "currency",
        currency: "USD",
    });
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

document.addEventListener("DOMContentLoaded", init);
