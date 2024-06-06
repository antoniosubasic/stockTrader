import endpoint from "../assets/scripts/config.js";

document.addEventListener('DOMContentLoaded', () => {
    const signUpForm = document.getElementById('signup-form');
    const responseDiv = document.querySelector("#modal .modal-body .content");
    const modal = new bootstrap.Modal(document.getElementById('modal'));

    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signUpForm.username.value;
        const password = signUpForm.password.value;
        const confirmPassword = signUpForm.confirmPassword.value;

        if (username && password && confirmPassword) {
            responseDiv.innerHTML = `
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Signing in...</span>
                </div>
            `;
            modal.show();

            if (password !== confirmPassword) {
                responseDiv.innerHTML = '<p class="error">Passwords do not match</p>';
                signUpForm.confirmPassword.value = signUpForm.password.value = '';
                return;
            }

            if (password.length < 8) {
                responseDiv.innerHTML = '<p class="error">Password must be at least 8 characters long</p>';
                signUpForm.password.value = signUpForm.confirmPassword.value = '';
                return;
            }

            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasDigit = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!(hasUppercase && hasLowercase && hasDigit && hasSpecial)) {
                responseDiv.innerHTML = '<p class="error">Password must contain at least one <span class="bold">uppercase letter</span>, one <span class="bold">lowercase letter</span>, one <span class="bold">digit</span>, and one <span class="bold">special character</span></p>';
                signUpForm.password.value = signUpForm.confirmPassword.value = '';
                return;
            }

            const response = await fetch(`${endpoint}/user/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                responseDiv.innerHTML = `
                    <p class="success">Sign Up successful</p>
                    <p class="redirect-time"></p>
                `;

                document.querySelector('#modal .modal-body .btn-close').addEventListener('click', () => {
                    window.location.href = "../signIn";
                });

                const redirectTimeElement = document.querySelector(".modal-body .content .redirect-time");
                let redirectTime = 4;
                const redirectInterval = setInterval(() => {
                    redirectTimeElement.innerText = redirectTime === 0 ? 'Redirecting...' : `Redirecting in ${--redirectTime}...`;
                    if (redirectTime <= 0) {
                        clearInterval(redirectInterval);
                        window.location.href = "../signIn";
                    }
                }, 1000);
            } else {
                signUpForm.password.value = signUpForm.confirmPassword.value = '';
                responseDiv.innerHTML = `<p class="error">${await response.text()}</p>`;
            }
        }
    });
});
