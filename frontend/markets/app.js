import endpoint from "../assets/scripts/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch(`${endpoint}/market?symbol=AAPL`);

    if (response.ok) {
        const market = await response.json();
        const marketName = document.getElementById('market-name');
        marketName.innerHTML = market.symbol;

        const stockPrices = market.stockPrices;
        const stockPricesTable = document.getElementById('stock-prices-table');

        for (const stockPrice of stockPrices) {
            const tr = document.createElement('tr');
            const timestamp = document.createElement('td');
            timestamp.innerHTML = new Date(stockPrice.timestamp).toLocaleDateString();
            tr.appendChild(timestamp);

            const open = document.createElement('td');
            open.innerHTML = stockPrice.open;
            tr.appendChild(open);

            const high = document.createElement('td');
            high.innerHTML = stockPrice.high;
            tr.appendChild(high);

            const low = document.createElement('td');
            low.innerHTML = stockPrice.low;
            tr.appendChild(low);

            const close = document.createElement('td');
            close.innerHTML = stockPrice.close;
            tr.appendChild(close);

            stockPricesTable.appendChild(tr);
        }
    } else {
        console.error(await response.text());
    }
});