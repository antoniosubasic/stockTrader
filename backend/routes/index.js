import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { User } from "../models/userModel.js";
import { Market, Markets } from "../models/marketModel.js";

dotenv.config();
const port = process.env.PORT || 8000;
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post("/user/signin", (req, res) => {
    const { username, password } = req.body;
    const [user, [status, message]] = User.signIn(username, password);
    return user
        ? res.status(status).json(user)
        : res.status(status).send(message);
});

app.post("/user/signup", (req, res) => {
    const { username, password } = req.body;
    const [status, message] = User.signUp(username, password);
    return res.status(status).send(message);
});

app.post("/user/delete", (req, res) => {
    const { username, password } = req.body;
    const [status, message] = User.delete(username, password);
    return res.status(status).send(message);
});

app.get("/market", async (req, res) => {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).send("missing symbol query parameter");
    }

    const market = new Market(symbol);
    const [data, [status, message]] = await market.get();

    return status === 200
        ? res.status(status).json(data)
        : res.status(status).send(message);
});

app.get("/markets", (_, res) => {
    return res.status(200).json(Markets.getAll());
});

app.get("/markets/gainers", (req, res) => {
    const { count } = req.query;

    if (!count) {
        return res.status(400).send("missing count query parameter");
    }

    return res.status(200).json(Markets.getTopGainers(count));
});

app.get("/markets/losers", (req, res) => {
    const { count } = req.query;

    if (!count) {
        return res.status(400).send("missing count query parameter");
    }

    return res.status(200).json(Markets.getTopLosers(count));
});

app.listen(port, () => {
    console.log(`server running on port ${port}`);
});
