import endpoint from "../config.js";

document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const errorMessage = document.getElementById("error-message");

    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();

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
        } else {
            let error = `${response.status} - ${await response.text()}`;
            console.log(error);

            if (error === "400 - user is already signed in") {
                errorMessage.innerHTML = "<p>User is already signed in</p>";
            } else {
                errorMessage.innerHTML = "<p>Username or password is incorrect</p>";
            }
        }
    });
});
