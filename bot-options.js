const startOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '📋 Список замовлень 📋', callback_data: '/show-orderlist' }],
            [{ text: 'ℹ️ Інформація про замовлення ℹ️', callback_data: '/show-ordersinfo' }],
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