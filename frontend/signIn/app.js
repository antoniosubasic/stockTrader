import endpoint from "../assets/scripts/config.js";
import auth from "../assets/scripts/auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const responseDiv = document.querySelector("#modal .modal-body .content");
    const modal = new bootstrap.Modal(document.getElementById('modal'));

    signInForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = signInForm.username.value;
        const password = signInForm.password.value;

        if (username && password) {
            responseDiv.innerHTML = `
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Signing in...</span>
                </div>
            `;
            modal.show();

            const response = await fetch(`${endpoint}/user/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                if (await auth()) {
                    signInForm.password.value = "";
                    responseDiv.innerHTML = '<p class="error">User already signed in</p>';
                } else {
                    const { user, token: jwt } = await response.json();
                    localStorage.setItem("jwt", jwt);
                    localStorage.setItem("user", JSON.stringify(user));

                    responseDiv.innerHTML = `
                        <p class="success">Sign In successful</p>
                        <p class="redirect-time"></p>
                    `;

                    document.querySelector('#modal .modal-body .btn-close').addEventListener('click', () => {
                        window.location.href = "../dashboard";
                    });

                    const redirectTimeElement = document.querySelector(".modal-body .content .redirect-time");
                    let redirectTime = 4;
                    const redirectInterval = setInterval(() => {
                        redirectTimeElement.innerText = redirectTime === 0 ? 'Redirecting...' : `Redirecting in ${--redirectTime}...`;
                        if (redirectTime <= 0) {
                            clearInterval(redirectInterval);
                            window.location.href = "../dashboard";
                        }
                    }, 1000);
                }
            } else {
                signInForm.password.value = "";
                responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
            }
        }
    });
});
