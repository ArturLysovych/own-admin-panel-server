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
const { startOptions, backOptions } = require('./bot-options');
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

app.get('/404', (req, res) => {
    res.send('Error 404: this page not found.');
});
app.get('*', (req, res) => {
    res.send('Error 404: this page not found.');
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
    user.save();
}

// Функція додавання замовлення
function addOrder(order_fromClient) {
    const order = new Order(order_fromClient);
    order.save();
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

// telegram bot settings

async function getAllOrders() {
    try {
        const orders = await Order.find({});
        return orders;
    } catch (error) {
        console.error('Error getting orders:', error);
    }
}

const start = () => {
    let isCheckingPassword = false;
    let logged = false;

    bot.setMyCommands([
        { command: '/start', description: 'Logging 🍕' },
        { command: '/aboutorders', description: 'Orders 🍕' },
        { command: '/show-ordersinfo', description: 'Show orders info 🍕' },
        { command: '/show-orderlist', description: 'Show orders list 🍕' }
    ]);

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (logged === false) {
            if (!isCheckingPassword) {
                if (text === '/start') {
                    await bot.sendMessage(chatId, 'Greetings from the Telegram bot admin panel of the Bigmac pizzeria! Enter your password ... 😊');
                    isCheckingPassword = true;
                } else {
                    await bot.sendMessage(chatId, 'You entered the wrong command! 😞'); 
                }
            } else {
                if (text === adminPassword) {
                    await bot.sendMessage(chatId, 'You are logged in! 😃');
                    await bot.sendMessage(chatId, 'About orders', startOptions);
                    isCheckingPassword = false;
                    logged = true;
                } else {
                    await bot.sendMessage(chatId, 'Incorrect password! 😔');
                }
            }
        }
        
        if (logged === true) {
            if(text === '/aboutorders') {
                bot.sendMessage(chatId, 'About orders ℹ️', startOptions);
            }
        }
    });

    bot.on('callback_query', async (msg) => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/show-orderlist') {
            getAllOrders()
            .then((data) => {
                let goodNameArr = [];
                let optionsArr = [];
                for(let el of data) {
                    goodNameArr.push(`${el.good}: ${el.orderID}`);
                    optionsArr.push([{ text: `🍔 ${el.good}: ${el.orderID} 🍕`, callback_data: `${el.orderID}`}])
                }
                optionsArr.push([{ text: 'Back ◀️', callback_data: '/back' }]);
                return bot.sendMessage(chatId, 'All orders:', {
                    reply_markup: JSON.stringify({
                        inline_keyboard: optionsArr
                    })}
                );    
            })
            .catch((error) => {
                console.error(`Error getting data: ${error}`);
            })
        }
        if (data === '/show-ordersinfo') {
            getAllOrders()
            .then((data) => {
                let latestOrder = data[data.length - 1];
                let totalPrice = data.reduce((sum, order) => sum + parseFloat(order.price), 0);

                return bot.sendMessage(chatId, `
                    Total orders price: ${totalPrice} 💰\nOrders count: ${data.length} 🔢\nLatest ordered: ${latestOrder.orderTime} 🕚
                `, backOptions);
            })
            .catch((error) => {
                console.error(`Error getting data: ${error}`);
            })
        }
        if (data === '/back') {
            bot.sendMessage(chatId, 'ℹ️ About orders ℹ️', startOptions);
        }
        let findOrder = await Order.findOne({ orderID: data });

        if (findOrder) {
            bot.sendMessage(chatId, `
                Good: ${findOrder.good} 🍕\nPrice: ${findOrder.price} 💰\nClient: ${findOrder.client} 👤\nOrderID: ${findOrder.orderID} 🔢\nCount: ${findOrder.count} 🛒\nOrder time: ${findOrder.orderTime} ⏰
            `, {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🏁 Finish 🏁', callback_data: `/finish-order-${findOrder.orderID}` }, { text: '❌ Delete ❌', callback_data: `/finish-order-${findOrder.orderID}` }],
                        [{ text: 'Back ◀️', callback_data: '/back' }]
                    ]
                })
            });
        }
        if (data.slice(0, 13) === '/finish-order') {
            let orderID = data.slice(14, data.length);
            deleteOrder(orderID);
            bot.sendMessage(chatId, '✅ Order completed ✅', backOptions);
        }
    });
};

start();