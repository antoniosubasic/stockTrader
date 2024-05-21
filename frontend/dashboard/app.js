import auth from "../assets/scripts/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    if (!await auth()) {
        window.location.href = "../signIn";
    }
});
