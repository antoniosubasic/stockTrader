import endpoint from '../config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signinForm.username.value;
        const password = signinForm.password.value;
        const confirmPassword = signinForm.confirmPassword.value;

        if (password !== confirmPassword) {
            errorMessage.innerHTML = '<p>Passwords do not match</p>';
            signinForm.confirmPassword.value = signinForm.password.value = '';
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
