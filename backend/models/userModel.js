import { sha512 } from 'js-sha512';
import { Controller as UserController } from '../controllers/userController.js';

const userController = new UserController();

export class User {
    _signedIn = false;

    constructor(name, password) {
        this._name = name;
        this._password = password;
    }

    signIn() {
        if (this._signedIn) {
            return [400, 'user is already signed in'];
        }

        const user = userController.get(this._name);

        if (!user) {
            return [404, 'user not found'];
        } else if (user.password !== sha512(this._password)) {
            return [401, 'password is incorrect'];
        } else {
            this._signedIn = true;
            const { password, ...userData } = user;
            return [200, userData];
        }
    }

    signOut() {
        this._signedIn = false;
    }

    static signUp(name, password) {
        if (userController.get(name)) {
            return [400, 'user already exists'];
        }

        userController.create(name, sha512(password));
        return [200, 'user created'];
    }

    static delete(name, password) {
        const user = userController.get(name);

        if (!user) {
            return [404, 'user not found'];
        } else if (user.password !== sha512(password)) {
            return [401, 'password is incorrect'];
        } else {
            userController.delete(name);
            return [200, 'user deleted'];
        }
    }

    get name() {
        return this._name;
    }
}
