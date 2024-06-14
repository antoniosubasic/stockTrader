import auth from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    const signInUpDiv = document.getElementById("signInUp-container");

    const location = window.location.pathname;
    let path = `.${
        ["markets", "dashboard"].some((str) => location.includes(str))
            ? "."
            : ""
    }`;

    if (await auth()) {
        const user = JSON.parse(localStorage.getItem("user"));

        signInUpDiv.innerHTML = `
        <div class="dropdown">
            <button class="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-weight: 600;">
                <img src="${path}/assets/images/profiles/${
            user.profilePicture ? user.profilePicture : "default1.jpeg"
        }" class="rounded-circle" style="height: 3rem; margin-right: 0.5rem;"> Hello, ${
            user.name
        }
            </button>
      
            <ul class="dropdown-menu">
                <li><a class="dropdown-item btn settings" href="${path}/dashboard/userSettings"><img src="${path}/assets/images/settings.png" style="height: 1rem; margin-right: 0.5rem;"> Settings</a></li>
                <li><button class="dropdown-item btn settings" id="logOut"><img src="${path}/assets/images/logout.png" style="height: 1rem; margin-right: 0.5rem;"> Log Out</button></li>
            </ul>
        </div>
        `;

        document.getElementById("logOut").addEventListener("click", () => {
            localStorage.removeItem("user");
            localStorage.removeItem("jwt");
            window.location.reload();
        });
    } else {
        signInUpDiv.innerHTML = `
        <a href="${path}/signIn/" class="btn signInUp" role="button" aria-disabled="true" style="border: 0;">Sign in</a>
        <a href="${path}/signUp/" class="btn signInUp" role="button" aria-disabled="true" style="border: 2px black solid; border-radius: 2rem;">Sign up</a>
        `;
    }
});
