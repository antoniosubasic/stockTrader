import { Drawer } from "./assets/scripts/drawer.js";

async function init() {
    const drawer = new Drawer("AAPL");
    await drawer.drawMarket();

}

document.addEventListener("DOMContentLoaded", init);