import cryptojs from "crypto-js";
import { Controller as UserController } from "../controllers/userController.js";
import e from "express";

const userController = new UserController();
const hash = (password) => cryptojs.SHA512(password).toString();

export class User {
    _id;
    _name;
    _balance;
    _transactions;
    _currentStocks;
    _staredStocks;
    _favoriteStock;
    _profilePicture;

    static from(user) {
        const newUser = new User();
        newUser._id = user.id;
        newUser._name = user.name;
        newUser._balance = user.balance;
        newUser._transactions = user.transactions;
        newUser._currentStocks = user.currentStocks;
        newUser._staredStocks = user.staredStocks;
        newUser._favoriteStock = user.favoriteStock;
        newUser._profilePicture = user.profilePicture;
        return newUser;
    }

    static signIn(username, password) {
        const user = userController.getByName(username);

        if (!user) {
            return [null, [404, "user not found"]];
        } else if (user.password !== hash(password)) {
            return [null, [401, "password is incorrect"]];
        } else {
            return [User.from(user), [200, "signin successful"]];
        }
    }

    static signUp(username, password) {
        if (userController.getByName(username)) {
            return [400, "user already exists"];
        }

        userController.create(username, hash(password));
        return [200, "user created"];
    }

    static delete(id, password) {
        const user = userController.getById(id);

        if (!user) {
            return [404, "user not found"];
        } else if (user.password !== hash(password)) {
            return [401, "password is incorrect"];
        } else {
            userController.delete(id);
            return [200, "user deleted"];
        }
    }

    static exists(id, name) {
        const user = userController.getById(id);
        return user && user.name === name ? true : false;
    }

    static buy(userId, symbol, quantity, price, timestamp) {
        const user = userController.getById(userId);

        if (!user) {
            return [null, [404, "user not found"]];
        }

        if (!user.transactions) {
            user.transactions = [];
        }
        if (!user.currentStocks) {
            user.currentStocks = [];
        }

        if (user.balance < quantity * price + 25) {
            return [null, [403, "insufficient balance"]];
        }
        user.transactions.push({ symbol, quantity, price, timestamp, type: "BUY" });

        const stock = user.currentStocks.find((s) => s.symbol === symbol);
        if (stock) {
            stock.quantity += quantity;
            stock.averagePrice =
                (stock.averagePrice * (stock.quantity - quantity) +
                    price * quantity) /
                stock.quantity;
        } else {
            user.currentStocks.push({ symbol, quantity, averagePrice: price });
        }

        user.balance -= quantity * price + 25;
        userController.update(user);

        return [User.from(user), [200, "stock bought"]];
    }

    static sell(userId, symbol, quantity, price, timestamp) {
        const user = userController.getById(userId);

        if (!user) {
            return [null, [404, "user not found"]];
        }

        if (!user.currentStocks) {
            return [null, [400, "no stocks to sell"]];
        }

        const stock = user.currentStocks.find((s) => s.symbol === symbol);
        if (!stock || stock.quantity < quantity) {
            return [null, [400, "insufficient stocks"]];
        }

        user.transactions.push({ symbol, quantity, price, timestamp, type: "SELL" });
        stock.quantity -= quantity;
        user.balance += quantity * price - 25;
        
        if (stock.quantity === 0) {
            user.currentStocks = user.currentStocks.filter((s) => s.symbol !== symbol);
        }

        userController.update(user);

        return [User.from(user), [200, "stock sold"]];
    }

    static updateFavoriteStock(userId, favoriteStock) {
        const user = userController.getById(userId);

        if (!user) {
            return [null, [404, "user not found"]];
        }

        user.favoriteStock = favoriteStock;
        userController.update(user);
        return [User.from(user), [200, "favorite stock updated"]];
    }

    static updatePassword(id, password, newPassword) {
        const user = userController.getById(id);

        if (!user) {
            return [null, [404, "user not found"]];
        } else if (user.password !== hash(password)) {
            return [null, [401, "password is incorrect"]];
        } else {
            user.password = hash(newPassword);
            userController.update(user);
            return [User.from(user), [200, "password updated"]];
        }
    }

    static updateUsername(id, password, newUsername) {
        const user = userController.getById(id);

        if (!user) {
            return [null, [404, "user not found"]];
        } else if (user.password !== hash(password)) {
            return [null, [401, "password is incorrect"]];
        } else {
            user.name = newUsername;
            userController.update(user);
            return [User.from(user), [200, "username updated"]];
        }
    }

    static updateProfilePicture(id, profilePicture) {
        const user = userController.getById(id);

        if (!user) {
            return [null, [404, "user not found"]];
        } else {
            user.profilePicture = profilePicture;
            userController.update(user);
            return [User.from(user), [200, "profile picture updated"]];
        }
    }

    getData() {
        return {
            id: this._id,
            name: this._name,
            balance: this._balance,
            transactions: this.transactions ? this.transactions : [],
            currentStocks: this._currentStocks ? this._currentStocks : [],
            staredStocks: this._staredStocks ? this._staredStocks : [],
            favoriteStock: this._favoriteStock,
            profilePicture: this._profilePicture ? this._profilePicture : "",
        };
    }

    get name() {
        return this._name;
    }

    get transactions() {
        return this._transactions;
    }

    set transactions(value) {
        this._transactions = value;
    }
}
