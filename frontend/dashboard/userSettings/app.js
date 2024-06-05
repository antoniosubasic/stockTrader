import auth from "../../assets/scripts/auth.js";
import endpoint from "../../assets/scripts/config.js";

async function init() {
    if (!await auth()) {
        window.location.href = "../../signIn";
    }

    const logOut = document.getElementById("logOut");
    const markets = await fetchMarkets(`${endpoint}/markets`);
    const favoriteMarketSearchForm = document.getElementById("favorite-market-form");
    const favoriteMarketSearchInput = document.getElementById("favorite-market-search");
    const favoriteMarketResultsDiv = document.getElementById("favorite-market-results");

    const user = JSON.parse(localStorage.getItem("user"));

    favoriteMarketSearchInput.value = `${markets.find((m) => m.symbol === user.favoriteStock).name}`;

    logOut.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwt");
        window.location.reload();
    });

    favoriteMarketSearchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        filterAndDisplayFavoriteMarkets(value, favoriteMarketResultsDiv, markets);
    });

    favoriteMarketSearchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const enteredValue = favoriteMarketSearchInput.value;
        favoriteMarketResultsDiv.innerHTML = "";
        const market = markets.find(
            (m) =>
                m.name.toLowerCase() === enteredValue.toLowerCase() ||
                m.symbol.toLowerCase() === enteredValue.toLowerCase()
        );

        if (market) {
            await updateFavoriteMarkets(market);
        } else {
            console.error("market not found");
        }
    });

}

function filterAndDisplayFavoriteMarkets(value, resultsDiv, markets) {
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
            resultItem.classList.add("result-item-favorite-market");
            resultItem.textContent = `${market.name} (${market.symbol})`;

            resultItem.addEventListener("click", async () => {
                await updateFavoriteMarkets(market);
            });
            newDiv.appendChild(resultItem);
        });

        if (newDiv.children.length === 0) {
            resultsDiv.innerHTML = `<div><p class="result-item-favorite-market">No results</p></div>`;
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

async function updateFavoriteMarkets(market) {
    document.getElementById("favorite-market-search").value = `${market.name}`;

    const response = await fetch(`${endpoint}/user/update/favoriteStock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ stockSymbol: market.symbol }),
    });

    if (response.ok) {
        const user = JSON.parse(localStorage.getItem("user"));
        user.favoriteStock = market.symbol;
        localStorage.setItem("user", JSON.stringify(user));

        const favoriteMarketResultsDiv = document.getElementById("favorite-market-results");
        favoriteMarketResultsDiv.innerHTML = `<div><p class="result-item-favorite-market green">Favorite stock updated</p></div>`;

        setTimeout(() => {
            favoriteMarketResultsDiv.innerHTML = "";
        }, 2000);
    } else {
        console.error(await response.text());
    }
}

document.addEventListener("DOMContentLoaded", init);
