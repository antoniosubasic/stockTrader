import { UserSession } from "../scripts/api.js";

document.addEventListener('DOMContentLoaded', () => {
    const signUpForm = document.getElementById('signup-form');

    signUpForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = signUpForm.username.value;
        const password = signUpForm.password.value;

        try {
            await UserSession.signUp(username, password);
            window.location.href = '../signIn';
        } catch (error) {
            alert(error.message);
        }
    });
});
