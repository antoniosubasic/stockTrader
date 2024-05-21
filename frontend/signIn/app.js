import endpoint from "../assets/scripts/config.js";

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
            if (localStorage.getItem("jwt")) {
                errorMessage.innerHTML = "<p>User already signed in</p>";
            } else {
                const { user, token: jwt } = await response.json();
                localStorage.setItem("jwt", jwt);
                localStorage.setItem("user", JSON.stringify(user));
                window.location.href = "../dashboard";
            }
        } else {
            errorMessage.innerHTML = `<p>${await response.text()}</p>`;
            signInForm.password.value = "";
        }
    });
});
