import endpoint from "../config.js";

document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const errorMessage = document.getElementById("error-message");

    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMessage.innerHTML = "";

        const username = signInForm.username.value;
        const password = signInForm.password.value;

        const response = await fetch(`${endpoint}/user/signin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            window.location.href = "../home";
            localStorage.setItem("user", JSON.stringify(await response.json()));
        } else {
            errorMessage.innerHTML = `<p>${await response.text()}</p>`;
            signInForm.password.value = '';
        }
    });
});
