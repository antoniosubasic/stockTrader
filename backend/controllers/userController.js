import fs from 'fs';

const file = './data/users.json';

export class Controller {
    _users = null;

    constructor() {
        this._users = JSON.parse(fs.readFileSync(file));
    }

    save() {
        fs.writeFileSync(file, JSON.stringify(this._users));
    }

    getByName(name) {
        return this._users.find(user => user.name === name);
    }

    getById(id) {
        return this._users.find(user => user.id === id);
    }

    create(name, password) {
        this._users.push({
            id: this._users.length,
            name,
            password,
            balance: 50_000
        });

        this.save();
    }

    delete(name) {
        this._users = this._users.filter(user => user.name !== name);
        this.save();
    }

    get users() {
        return this._users;
    }
}
