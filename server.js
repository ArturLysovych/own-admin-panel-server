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
let myAccount = { login: '', password: '', email: '' };
const clientPath = path.join('../client', 'dist');

const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(clientPath));

app.get('/', (req, res) => {
    res.sendFile('login.html', { root: clientPath });
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
    orderTime: String
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);


// Замовлення з клієнта
let orders_fromClient = [
    {
        good: 'Pizza',
        price: 24,
        client: 'Vitalik',
        orderID: 'A9B1C4',
        orderTime: '09:39, 17.09.2023'
    },
    {
        good: 'Burger',
        price: 12,
        client: 'Artur',
        orderID: 'B3T5Y8',
        orderTime: '14:20, 18.09.2023'
    },
    {
        good: 'Humburger',
        price: 16,
        client: 'Bodya',
        orderID: 'S0S1U7',
        orderTime: '15:50, 20.09.2023'
    }
];


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


// Функція входу в аккаунт
// async function logUser(userLogin_fromClient, userPassword_fromClient) {
//     try {
//         const user = await db.collection('users').findOne({ userLogin_fromClient: userLogin_fromClient });

//         console.log(user)
//         if (user.userPassword_fromClient === userPassword_fromClient) {
//             console.log('Successfully login');
//             return 'Successfully login';
//         } else {
//             console.log('False data');
//             return 'False data';
//         }
//     } catch (error) {
//         console.error('Помилка при пошуку користувача:', error);
//         // Відправити клієнту - 'Користувача не знайдено'
//         return 'This user not found';
//     }
// }


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

// Додавання замовлення
// addOrder(orders_fromClient[1]);
// Видалення замовле=ння
// deleteOrder('B3T5Y8');