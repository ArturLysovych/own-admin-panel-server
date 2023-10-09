const startOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '📋 Orders list 📋', callback_data: '/show-orderlist' }],
            [{ text: 'ℹ️ Orders info ℹ️', callback_data: '/show-ordersinfo' }],
        ]
    })
};

const backOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Back ◀️', callback_data: '/back' }]
        ]
    })
};

module.exports = {
    startOptions,
    backOptions
};