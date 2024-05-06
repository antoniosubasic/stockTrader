function init() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "../../signIn";
    }

    const logOut = document.getElementById("logOut");
    logOut.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.reload();
    });

}


document.addEventListener("DOMContentLoaded", init);
