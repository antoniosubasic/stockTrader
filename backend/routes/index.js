import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { User } from '../models/userModel.js';
import { Market } from '../models/marketModel.js';

const port = 8000;
const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/user/signin', (req, res) => {
    const { username, password } = req.body;
    const [user, [status, message]] = User.signIn(username, password);

    if (user) {
        return res.status(status).json(user);
    } else {
        return res.status(status).send(message);
    }
});

app.post('/user/signup', (req, res) => {
    const { username, password } = req.body;
    const [status, message] = User.signUp(username, password);
    return res.status(status).send(message);
});

app.post('/user/delete', (req, res) => {
    const { username, password } = req.body;
    const [status, message] = User.delete(username, password);
    return res.status(status).send(message);
});

app.get('/market', async (req, res) => {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).send('missing symbol query parameter');
    }

    const market = new Market(symbol);
    const [data, [status, message]] = await market.get();

    return status === 200 ? res.status(status).json(data) : res.status(status).send(message);
});

app.listen(port, () => {
    console.log(`server running on port ${port}`);
});
