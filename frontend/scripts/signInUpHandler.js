function checkUser() {
    const user = localStorage.getItem("user");
    const signInUpDiv = document.getElementById("signInUp-container");

    const location = window.location.pathname;
    let path = `.${
        ["markets", "dashboard"].some((str) => location.includes(str))
            ? "."
            : ""
    }`;

    if (user) {
        const userName = JSON.parse(user)._name;

        signInUpDiv.innerHTML = `
        <div class="dropdown">
            <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="${path}/img/blank-profile.webp"class="rounded" style="height: 1.5rem;"> Hello, ${userName}
            </button>
      
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#"><img src="${path}/img/settings.png" style="height: 1rem; margin-right: 0.5rem;"> Settings</a></li>
                <li><button class="dropdown-item btn btn-outline-primary" id="logOut"><img src="${path}/img/logout.webp" style="height: 1rem; margin-right: 0.5rem;"> Log Out</button></li>
            </ul>
        </div>
        `;
        document.getElementById("logOut").addEventListener("click", logOut);
    } else {
        signInUpDiv.innerHTML = `
        <a href="${path}/signIn/" class="btn btn-outline-primary" role="button" aria-disabled="true">Sign In</a>
        <a href="${path}/signUp/" class="btn btn-outline-primary" role="button" aria-disabled="true" style="margin-left: 1rem">Sign Up</a>
        `;
    }
}

function logOut() {
    localStorage.removeItem("user");
    checkUser();
}

document.addEventListener("DOMContentLoaded", checkUser);
