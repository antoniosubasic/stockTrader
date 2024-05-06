function init() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "../../signIn";
    }
}

document.addEventListener("DOMContentLoaded", init);
