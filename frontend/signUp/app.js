import endpoint from '../config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signup-form');

    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = signinForm.username.value;
        const password = signinForm.password.value;

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
        }
    });
});
