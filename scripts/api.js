async function hash(data) {
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

class Users {
    static _users = null;
    static _endpoint = 'http://localhost:8000/users';

    static async load() {
        const response = await fetch(this._endpoint);
        this._users = await response.json();
    }

    static async get(name = null) {
        if (!this._users) {
            await this.load();
        }

        return name ? this._users.find(user => user.name === name) : this._users;
    }

    static async add(name, password) {
        if (!this._users) {
            await this.load();
        }

        const response = await fetch(this._endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                password: await hash(password),
                balance: 50_000,
            }),
        });

        this._users.push(await response.json());
    }
}

export class UserSession {
    _loggedIn = false;
    _id = null;
    _name = null;
    _balance = null;

    async signIn(name, password) {
        if (this._loggedIn) {
            throw new Error('already logged in');
        }

        const user = await Users.get(name);
        console.log(user);
        console.log(typeof user);

        if (!user) {
            throw new Error('user not found');
        }

        if (user.password !== await hash(password)) {
            throw new Error('wrong password');
        }

        this._loggedIn = true;
        this._id = user.id;
        this._name = user.name;
        this._balance = user.balance;
    }

    signOut() {
        this._loggedIn = false;
        this._id = null;
        this._name = null;
        this._balance = null;
    }

    static async signUp(name, password) {
        if (await Users.get(name)) {
            throw new Error('user already exists');
        }

        await Users.add(name, password);
    }

    get loggedIn() {
        return this._loggedIn;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get balance() {
        return this._balance;
    }
}
