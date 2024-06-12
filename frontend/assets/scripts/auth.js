import endpoint from "./config.js";

export default async function auth() {
    const jwt = localStorage.getItem("jwt");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!jwt || !user) {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        return false;
    }

    const response = await fetch(`${endpoint}/user/auth`, {
        headers: { Authorization: `Bearer ${jwt}` }
    });

    if (response.status === 200) {
        const decoded = await response.json();
        
        if (decoded.name !== user.name || decoded.id !== user.id) {
            localStorage.removeItem("jwt");
            localStorage.removeItem("user");
            return false;
        } else {
            return true;
        }
    } else {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        return false;
    }
}
