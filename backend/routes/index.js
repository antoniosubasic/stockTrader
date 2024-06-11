import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
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

    if (user) {
        const userData = user.getData();
        const token = jwt.sign(userData, process.env.JWT_SECRET);
        return res.status(status).json({ user: userData, token });
    } else {
        return res.status(status).send(message);
    }
});

app.post("/user/update/favoriteStock", (req, res) => {
    const { stockSymbol } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!stockSymbol) {
        return res.status(400).send("missing favoriteStock");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [user, [status, message]] = User.updateFavoriteStock(
                decoded.id,
                stockSymbol
            );

            if (user) {
                const userData = user.getData();
                return res.status(status).json({ user: userData });
            } else {
                return res.status(status).send(message);
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.post("/user/update/password", (req, res) => {
    const { password, newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!password || !newPassword) {
        return res.status(400).send("missing password or newPassword");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [user, [status, message]] = User.updatePassword(
                decoded.id,
                password,
                newPassword
            );

            if (user) {
                const userData = user.getData();
                return res.status(status).json({ user: userData });
            } else {
                return res.status(status).send(message);
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.post("/user/update/username", (req, res) => {
    const { password, newUsername } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!password || !newUsername) {
        return res.status(400).send("missing password or newUsername");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [user, [status, message]] = User.updateUsername(
                decoded.id,
                password,
                newUsername
            );

            if (user) {
                const userData = user.getData();
                return res.status(status).json({ user: userData });
            } else {
                return res.status(status).send(message);
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.post("/user/update/profilePicture", (req, res) => {
    const { profilePicture } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!profilePicture) {
        return res.status(400).send("missing profilePicture");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [user, [status, message]] = User.updateProfilePicture(
                decoded.id,
                profilePicture
            );

            if (user) {
                const userData = user.getData();
                return res.status(status).json({ user: userData });
            } else {
                return res.status(status).send(message);
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.post("/user/signup", (req, res) => {
    const { username, password } = req.body;
    const [status, message] = User.signUp(username, password);
    return res.status(status).send(message);
});

app.post("/user/delete", (req, res) => {
    const { password } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!password) {
        return res.status(400).send("missing password");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const [status, message] = User.delete(decoded.id, password);
            return res.status(status).send(message);
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.get("/user/auth", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (User.exists(decoded.id, decoded.name)) {
                return res
                    .status(200)
                    .json({ id: decoded.id, name: decoded.name });
            } else {
                return res.status(404).send("user not found");
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
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

app.get("/market/latest", async (req, res) => {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).send("missing symbol query parameter");
    }

    const market = new Market(symbol);
    const [data, [status, message]] = await market.getLatestData();

    return status === 200
        ? res.status(status).json(data)
        : res.status(status).send(message);
});

app.post("/market/buy", async (req, res) => {
    const { symbol, quantity } = req.query;
    const token = req.headers.authorization?.split(" ")[1];

    if (!symbol || !quantity) {
        return res
            .status(400)
            .send("missing symbol or quantity query parameter");
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (User.exists(decoded.id, decoded.name)) {
                const market = new Market(symbol);
                const [data, [status, message]] = await market.get();

                if (status === 200) {
                    const latest =
                        data.stockPrices[data.stockPrices.length - 1];

                    const [user, [status, message]] = User.buy(
                        decoded.id,
                        symbol,
                        parseInt(quantity),
                        latest.close,
                        new Date()
                    );

                    if (user) {
                        const userData = user.getData();
                        return res.status(status).json(userData);
                    } else {
                        return res.status(status).send(message);
                    }
                } else {
                    return res.status(status).send(message);
                }
            } else {
                return res.status(404).send("user not found");
            }
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }
});

app.post("/market/sell", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const sellData = req.body;
    let decoded;

    if (token) {
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).send("invalid token");
        }
    } else {
        return res.status(401).send("missing token");
    }

    if (sellData) {
        let userData;

        for (const data of sellData) {
            const { symbol, quantity } = data;

            if (!symbol || !quantity) {
                return res
                    .status(400)
                    .send("missing symbol or quantity query parameter");
            }

            if (User.exists(decoded.id, decoded.name)) {
                const market = new Market(symbol);
                const [data, [status, message]] = await market.get();

                if (status === 200) {
                    const latest =
                        data.stockPrices[data.stockPrices.length - 1];

                    const [user, [status, message]] = User.sell(
                        decoded.id,
                        symbol,
                        parseInt(quantity),
                        latest.close,
                        new Date()
                    );

                    if (user) {
                        userData = user.getData();
                    } else {
                        return res.status(status).send(message);
                    }
                } else {
                    return res.status(status).send(message);
                }
            } else {
                return res.status(404).send("user not found");
            }
        }

        return res.status(200).json(userData);
    }
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
