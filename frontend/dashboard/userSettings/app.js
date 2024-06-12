import auth from "../../assets/scripts/auth.js";
import endpoint from "../../assets/scripts/config.js";

let responseDiv;
let modal;
let profilePictureModalDiv;
let profilePictureModal;

async function init() {
    if (!(await auth())) {
        window.location.href = "../../signIn";
    }

    const logOut = document.getElementById("logOut");
    const markets = await fetchMarkets(`${endpoint}/markets`);

    const favoriteMarketSearchForm = document.getElementById(
        "favorite-market-form"
    );
    const favoriteMarketSearchInput = document.getElementById(
        "favorite-market-search"
    );
    const favoriteMarketResultsDiv = document.getElementById(
        "favorite-market-results"
    );

    responseDiv = document.querySelector("#modal .modal-body .content");
    modal = new bootstrap.Modal(document.getElementById("modal"));
    profilePictureModalDiv = document.querySelector(
        "#profile-picture-modal .modal-body .content"
    );
    profilePictureModal = new bootstrap.Modal(
        document.getElementById("profile-picture-modal")
    );

    const updatePasswordForm = document.getElementById("update-password-form");
    const updateUsernameForm = document.getElementById("update-username-form");
    const deleteAccountForm = document.getElementById("delete-account-form");

    const userDiv = document.getElementById("userDiv");
    const greetingDiv = document.querySelector("#userDiv > .greeting");

    const user = JSON.parse(localStorage.getItem("user"));
    favoriteMarketSearchInput.value = `${
        markets.find((m) => m.symbol === user.favoriteStock).name
    }`;

    const profileImage = document.getElementById("profilePicture");
    if (user.profilePicture) {
        profileImage.src = `../../assets/images/profiles/${user.profilePicture}`;
    }

    greetingDiv.innerHTML += `<p class="name">Hello, ${user.name}</p>`;

    userDiv.innerHTML += `
    <p><b>Balance:</b> $${user.balance.toFixed(2)}</p>
    <p><b>Favorite Market:</b> ${
        markets.find((m) => m.symbol === user.favoriteStock).name
    } (${user.favoriteStock})</p>
    `;

    document
        .getElementById("profilePictureDiv")
        .addEventListener("click", () => {
            handleUserProfileClick();
        });

    logOut.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwt");
        window.location.reload();
    });

    favoriteMarketSearchInput.addEventListener("input", (e) => {
        const value = e.target.value;
        filterAndDisplayFavoriteMarkets(
            value,
            favoriteMarketResultsDiv,
            markets
        );
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

    updatePasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleUpdatePassword(updatePasswordForm);
    });

    updateUsernameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleUpdateUsername(updateUsernameForm);
    });

    deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleDeleteAccount(deleteAccountForm);
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
    if (market) {
        responseDiv.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Updating favorite market...</span>
        </div>
        `;
        modal.show();

        document.getElementById(
            "favorite-market-search"
        ).value = `${market.name}`;

        const response = await fetch(`${endpoint}/user/update/favoriteStock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify({ stockSymbol: market.symbol }),
        });

        if (response.ok) {
            responseDiv.innerHTML = `
            <p class="success">Favorite market updated successfully</p>
            <p class="redirect-time"></p>
            `;

            document
                .querySelector("#modal .modal-body .btn-close")
                .addEventListener("click", () => {
                    const user = JSON.parse(localStorage.getItem("user"));
                    user.favoriteStock = market.symbol;
                    localStorage.setItem("user", JSON.stringify(user));
                    window.location.reload();
                });

            const redirectTimeElement = document.querySelector(
                "#modal .modal-body .content .redirect-time"
            );
            let redirectTime = 4;
            const redirectInterval = setInterval(() => {
                redirectTimeElement.innerText =
                    redirectTime === 0
                        ? "Reloading..."
                        : `Reloading in ${--redirectTime}...`;
                if (redirectTime <= 0) {
                    clearInterval(redirectInterval);

                    const user = JSON.parse(localStorage.getItem("user"));
                    user.favoriteStock = market.symbol;
                    localStorage.setItem("user", JSON.stringify(user));

                    window.location.reload();
                }
            }, 1000);
        } else {
            console.error(await response.text());
        }
    }
}

async function handleUpdatePassword(updatePasswordForm) {
    const password = updatePasswordForm.currentPasswordNewPassword.value;
    const newPassword = updatePasswordForm.newPassword.value;
    const confirmNewPassword = updatePasswordForm.confirmNewPassword.value;

    if (password && newPassword && confirmNewPassword) {
        responseDiv.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Updating password...</span>
        </div>
        `;
        modal.show();

        if (newPassword !== confirmNewPassword) {
            responseDiv.innerHTML = `<p class="error">Passwords do not match</p>`;
            updatePasswordForm.newPassword.value =
                updatePasswordForm.confirmNewPassword.value = "";
            return;
        }

        if (newPassword.length < 8) {
            responseDiv.innerHTML =
                '<p class="error">Password must be at least 8 characters long</p>';
            updatePasswordForm.newPassword.value =
                updatePasswordForm.confirmNewPassword.value = "";
            return;
        }

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!(hasUppercase && hasLowercase && hasDigit && hasSpecial)) {
            responseDiv.innerHTML =
                '<p class="error">Password must contain at least one <span class="bold">uppercase letter</span>, one <span class="bold">lowercase letter</span>, one <span class="bold">digit</span>, and one <span class="bold">special character</span></p>';
            updatePasswordForm.newPassword.value =
                updatePasswordForm.confirmNewPassword.value = "";
            return;
        }

        const response = await fetch(`${endpoint}/user/update/password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify({ password, newPassword }),
        });

        if (response.ok) {
            responseDiv.innerHTML = `
            <p class="success">Password updated successfully</p>
            <p class="redirect-time"></p>
            `;

            const redirectTimeElement = document.querySelector(
                "#modal .modal-body .content .redirect-time"
            );
            let redirectTime = 4;
            const redirectInterval = setInterval(() => {
                redirectTimeElement.innerText =
                    redirectTime === 0
                        ? "Reloading..."
                        : `Reloading in ${--redirectTime}...`;
                if (redirectTime <= 0) {
                    clearInterval(redirectInterval);

                    localStorage.removeItem("user");
                    localStorage.removeItem("jwt");

                    window.location.reload();
                }
            }, 1000);
        } else {
            updatePasswordForm.currentPasswordNewPassword.value =
                updatePasswordForm.newPassword.value =
                updatePasswordForm.confirmNewPassword.value =
                    "";
            responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
        }
    }
}

async function handleUpdateUsername(updateUsernameForm) {
    const password = updateUsernameForm.currentPasswordUsername.value;
    const newUsername = updateUsernameForm.newUsername.value;
    const confirmNewUsername = updateUsernameForm.confirmNewUsername.value;

    if (password && newUsername && confirmNewUsername) {
        responseDiv.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Updating username...</span>
        </div>
        `;
        modal.show();

        if (newUsername !== confirmNewUsername) {
            responseDiv.innerHTML = `<p class="error">Usernames do not match</p>`;
            updateUsernameForm.newUsername.value =
                updateUsernameForm.confirmNewUsername.value = "";
            return;
        }

        const response = await fetch(`${endpoint}/user/update/username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify({ password, newUsername }),
        });

        if (response.ok) {
            responseDiv.innerHTML = `
            <p class="success">Username updated successfully</p>
            <p class="redirect-time"></p>
            `;

            const redirectTimeElement = document.querySelector(
                "#modal .modal-body .content .redirect-time"
            );
            let redirectTime = 4;
            const redirectInterval = setInterval(() => {
                redirectTimeElement.innerText =
                    redirectTime === 0
                        ? "Reloading..."
                        : `Reloading in ${--redirectTime}...`;
                if (redirectTime <= 0) {
                    clearInterval(redirectInterval);

                    localStorage.removeItem("user");
                    localStorage.removeItem("jwt");

                    window.location.reload();
                }
            }, 1000);
        } else {
            updateUsernameForm.currentPasswordUsername.value =
                updateUsernameForm.newUsername.value =
                updateUsernameForm.confirmNewUsername.value =
                    "";
            responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
        }
    }
}

async function handleDeleteAccount(deleteAccountForm) {
    const password = deleteAccountForm.deletePassword.value;

    if (password) {
        responseDiv.innerHTML = `
        <p class="warning">Are you sure you want to delete your account?</p>
        <p class="warning">This action cannot be undone!</p>
        <button type="button" class="btn btn-danger" id="waringBtn">Delete Account</button>
        `;
        modal.show();

        const warningBtn = document.getElementById("waringBtn");
        warningBtn.addEventListener("click", async () => {
            responseDiv.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Deleting account...</span>
            </div>
                `;

            const response = await fetch(`${endpoint}/user/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                responseDiv.innerHTML = `
                <p class="success">Account deleted successfully</p>
                <p class="redirect-time"></p>
                `;

                const redirectTimeElement = document.querySelector(
                    "#modal .modal-body .content .redirect-time"
                );
                let redirectTime = 4;
                const redirectInterval = setInterval(() => {
                    redirectTimeElement.innerText =
                        redirectTime === 0
                            ? "Reloading..."
                            : `Reloading in ${--redirectTime}...`;
                    if (redirectTime <= 0) {
                        clearInterval(redirectInterval);

                        localStorage.removeItem("user");
                        localStorage.removeItem("jwt");

                        window.location.href = "../../signUp";
                    }
                }, 1000);
            } else {
                deleteAccountForm.deletePassword.value = "";
                responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
            }
        });
    }
}

function handleUserProfileClick() {
    function createImageElement(profilePicture) {
        const img = document.createElement("img");
        img.src = `../../assets/images/profiles/${profilePicture}`;
        img.classList.add("rounded-circle", "profile-picture-item");
        img.classList.add("profile-picture");
        img.addEventListener("click", () => {
            updateProfilePicture(profilePicture);
        });
        return img;
    }

    const profilePictureDiv = document.createElement("div");

    const profilePicturesDefault = [
        "default1.jpeg",
        "default2.jpeg",
        "default3.jpeg",
        "default4.jpeg",
        "default5.jpeg",
        "default6.jpeg",
        "default7.jpeg",
    ];

    const profilePicturesNature = [
        "nature1.jpeg",
        "nature2.jpeg",
        "nature3.jpeg",
        "nature4.jpeg",
        "nature5.jpeg",
        "nature6.jpeg",
        "nature7.jpeg",
        "nature8.jpeg",
        "nature9.jpeg",
    ];

    const profilePicturesMale = [
        "male1.jpeg",
        "male2.jpeg",
        "male3.jpeg",
        "male4.jpeg",
        "male5.jpeg",
        "male6.jpeg",
        "male7.jpeg",
        "male8.jpg",
        "male9.jpg",
        "male10.jpeg",
        "male11.jpeg",
        "male12.jpeg",
        "male13.jpeg", 
    ];

    const profilePicturesFemale = [
        "female1.jpeg",
        "female2.jpeg",
        "female3.jpeg",
        "female4.jpeg",
        "female5.jpeg",
        "female6.jpeg",
        "female7.jpeg",
    ];

    const profilePictureCar = [
        "car1.jpeg",
        "car2.jpeg",
        "car3.jpeg",
        "car4.jpeg",
        "car5.jpeg",
        "car6.jpeg",
        "car7.jpeg",
        "car8.jpeg",
        "car9.jpeg",
        "car10.jpeg",
        "car11.jpeg",
    ];

    function appendImagesToDiv(category, imagesArray) {
        const div = document.createElement("div");
        profilePictureDiv.appendChild(div);

        const h2 = document.createElement("h2");
        const subDiv = document.createElement("div");

        h2.textContent = category;
        h2.classList.add("profile-picture-category");
        div.appendChild(h2);
        div.appendChild(subDiv);

        imagesArray.forEach((profilePicture) => {
            subDiv.appendChild(createImageElement(profilePicture));
        });
    }

    appendImagesToDiv("Default", profilePicturesDefault);
    appendImagesToDiv("Nature", profilePicturesNature);
    appendImagesToDiv("Males", profilePicturesMale);
    appendImagesToDiv("Females", profilePicturesFemale);
    appendImagesToDiv("Cars", profilePictureCar);

    profilePictureModalDiv.innerHTML = `<h1 class="profile-picture-title">Select a profile picture</h1>`;
    profilePictureModalDiv.appendChild(profilePictureDiv);
    profilePictureModal.show();
}

async function updateProfilePicture(profilePicture) {
    profilePictureModal.hide();
    responseDiv.innerHTML = `
    <div class="spinner-border" role="status">
        <span class="visually-hidden">Updating profile picture...</span>
    </div>
    `;
    modal.show();

    const response = await fetch(`${endpoint}/user/update/profilePicture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ profilePicture }),
    });

    if (response.ok) {
        const user = JSON.parse(localStorage.getItem("user"));
        user.profilePicture = profilePicture;

        responseDiv.innerHTML = `
        <p class="success">Profile picture updated successfully</p>
        <p class="redirect-time"></p>
        `;

        document
            .querySelector("#modal .modal-body .btn-close")
            .addEventListener("click", () => {
                localStorage.setItem("user", JSON.stringify(user));
                window.location.reload();
            });

        const redirectTimeElement = document.querySelector(
            ".modal-body .content .redirect-time"
        );
        let redirectTime = 4;
        const redirectInterval = setInterval(() => {
            redirectTimeElement.innerText =
                redirectTime === 0
                    ? "Reloading..."
                    : `Reloading in ${--redirectTime}...`;
            if (redirectTime <= 0) {
                clearInterval(redirectInterval);

                localStorage.setItem("user", JSON.stringify(user));
                window.location.reload();
            }
        }, 1000);
    } else {
        responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", init);
