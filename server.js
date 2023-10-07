const express = require('express');
const app = express();
require('dotenv').config();
const TOKEN = process.env.TOKEN;
const DB_PASSWORD = process.env.DB_PASSWORD;
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(TOKEN, { polling: true });
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const clientPath = path.join('../client', 'dist');
let adminPassword = 'admin';

const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(clientPath));

app.get('/', (req, res) => {
    res.sendFile('login.html', { root: clientPath });
});

app.get('/panel', (req, res) => {
    res.sendFile('panel.html', { root: clientPath });
});

app.get('/user', (req, res) => {
    res.sendFile('user.html', { root: clientPath });
});

app.get('/log-panel', (req, res) => {
    res.sendFile('logpanel.html', { root: clientPath });
});

// Підключення до MongoDb
mongoose.connect(`mongodb+srv://arturlisovic:${DB_PASSWORD}@cluster0.hdbgfgy.mongodb.net/?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(error => {
    console.error('Error connecting to MongoDB:', error);
});

const db = mongoose.connection;

// Створення схем і моделей
const userSchema = new mongoose.Schema({
    userLogin_fromClient: String,
    userPassword_fromClient: String,
    userEmail_fromClient: String
});

const orderSchema = new mongoose.Schema({
    good: String,
    price: String,
    client: String,
    orderID: String,
    count: Number,
    img: String,
    orderTime: String
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// Функція реєстрації користувача
function regUser(userLogin_fromClient, userPassword_fromClient, userEmail_fromClient) {
    const user = new User({
        userLogin_fromClient: userLogin_fromClient,
        userPassword_fromClient: userPassword_fromClient,
        userEmail_fromClient: userEmail_fromClient
    });
    myAccount.login = userLogin_fromClient;
    myAccount.password = userPassword_fromClient;
    myAccount.email = userEmail_fromClient;
    user.save();
}

// Функція додавання замовлення
function addOrder(order_fromClient) {
    const order = new Order(order_fromClient);
    order.save();

    bot.sendMessage(1442775189, `Нові замовлення: \n${order.good}`);
}


// Функція видалення замовлення
function deleteOrder(orderID) {
    db.collection('orders').deleteOne({ orderID: orderID })
}


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server work on PORT: ${PORT}`);
});


app.post('/register-admin', (req, res) => {
    let login = req.body.login;
    let password = req.body.password;
    let email = req.body.email;

    regUser(login, password, email);
    res.send('User was registered');
});

app.post('/login-admin', async (req, res) => {
    const login = req.body.login;
    const password = req.body.password;

    try {
        const user = await db.collection('users').findOne({ userLogin_fromClient: login });

        if (user) {
            if (user.userPassword_fromClient === password) {
                console.log('Successfully login');
                res.send('Successfully login');
            } else {
                console.log('False data');
                res.send('False data');
            }
        } else {
            console.log('User not found');
            res.send('User not found');
        }
    } catch (error) {
        console.error('Помилка при пошуку користувача:', error);
        res.send('Помилка при пошуку користувача');
    }
});
    
app.post('/send-order', async (req, res) => {
    const orderedItems = req.body;
    for(let el of orderedItems) {
        addOrder(el);
    }
});

app.post('/delete-order', (req, res) => {
    let orderID = Object.keys(req.body)[0];
    deleteOrder(orderID);
});

app.get('/get-orders', async (req, res) => {
    try {
        const ordersArray = await Order.find({});
        res.json(ordersArray);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/check-adminLog', (req, res) => {
    try {
        res.send(adminPassword);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});