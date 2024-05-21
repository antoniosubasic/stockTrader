import auth from "../../assets/scripts/auth.js";

async function init() {
    if (!await auth()) {
        window.location.href = "../../signIn";
    }

    const logOut = document.getElementById("logOut");
    logOut.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("jwt");
        window.location.reload();
    });

}


document.addEventListener("DOMContentLoaded", init);
