import { UserSession } from "../scripts/api.js";

document.addEventListener('DOMContentLoaded', () => {
    const userSession = new UserSession();
    const signInForm = document.getElementById('signin-form');

    signInForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = signInForm.username.value;
        const password = signInForm.password.value;

        try {
            await userSession.signIn(username, password);
            window.location.href = '../dashboard';
        } catch (error) {
            alert(error.message);
        }
    });
});
