import endpoint from "../scripts/config.js";

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
            const currentUser = localStorage.getItem("user");
            const newUser = JSON.stringify(await response.json());

            console.log(currentUser);
            console.log(newUser);

            if (currentUser === newUser) {
                errorMessage.innerHTML = "<p>User already signed in</p>";
            } else if (currentUser) {
                errorMessage.innerHTML =
                    "<p>Another user is already signed in</p>";
            } else {
                window.location.href = "../dashboard";
                localStorage.setItem(
                    "user",
                    newUser
                );
            }
        } else {
            errorMessage.innerHTML = `<p>${await response.text()}</p>`;
            signInForm.password.value = "";
        }
    });
});
