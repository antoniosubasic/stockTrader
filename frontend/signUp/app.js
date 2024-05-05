import endpoint from '../config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signUpForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');

    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signUpForm.username.value;
        const password = signUpForm.password.value;
        const confirmPassword = signUpForm.confirmPassword.value;

        if (password !== confirmPassword) {
            errorMessage.innerHTML = '<p>Passwords do not match</p>';
            signUpForm.confirmPassword.value = signUpForm.password.value = '';
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
            window.location.href = '../signIn';
        } else {
            console.log(`${response.status} - ${await response.text()}`);
            errorMessage.innerHTML = '<p>Username already exists</p>';
        }
    });
});
