// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config();
// const UserProgress = require('./models/userProgress');

// const app = express();
// const port = process.env.PORT || 3001;
// const token = process.env.TOKEN;
// const bot = new TelegramBot(token, { polling: true });

// app.use(cors());
// app.use(bodyParser.json());

// mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('MongoDB подключен'))
//     .catch(err => console.log(err));


// // Известные ID и даты создания аккаунтов
// const knownIds = [
//   { id: 3226119, date: new Date('2013-11-29') },
//   { id: 10000000, date: new Date('2014-01-01') },
//   { id: 22616448, date: new Date('2014-02-25') },
//   { id: 48233544, date: new Date('2014-06-16') },
//   { id: 84212258, date: new Date('2014-11-13') },
//   { id: 90821803, date: new Date('2014-12-09') },
//   { id: 50000000, date: new Date('2015-01-01') },
//   { id: 125351604, date: new Date('2015-04-22') },
//   { id: 163936808, date: new Date('2015-09-10') },
//   { id: 184149163, date: new Date('2015-11-19') },
//   { id: 100000000, date: new Date('2016-01-01') },
//   { id: 217434958, date: new Date('2016-03-08') },
//   { id: 251436845, date: new Date('2016-06-22') },
//   { id: 289640704, date: new Date('2016-10-12') },
//   { id: 293503454, date: new Date('2016-10-23') },
//   { id: 309204290, date: new Date('2016-12-06') },
//   { id: 328943629, date: new Date('2017-01-28') },
//   { id: 335804205, date: new Date('2017-02-15') },
//   { id: 348700983, date: new Date('2017-03-20') },
//   { id: 349917088, date: new Date('2017-03-23') },
//   { id: 378640353, date: new Date('2017-06-02') },
//   { id: 415465792, date: new Date('2017-08-26') },
//   { id: 450868246, date: new Date('2017-11-11') },
//   { id: 454065520, date: new Date('2017-11-17') },
//   { id: 495852818, date: new Date('2018-02-09') },
//   { id: 530265287, date: new Date('2018-04-14') },
//   { id: 561009411, date: new Date('2018-06-06') },
//   { id: 597295643, date: new Date('2018-08-04') },
//   { id: 660554478, date: new Date('2018-11-06') },
//   { id: 727060329, date: new Date('2019-02-02') },
//   { id: 817733887, date: new Date('2019-05-17') },
//   { id: 840392776, date: new Date('2019-06-10') },
//   { id: 895758728, date: new Date('2019-08-04') },
//   { id: 942381636, date: new Date('2019-09-18') },
//   { id: 1000000000, date: new Date('2020-01-01') },
//   { id: 1170401681, date: new Date('2020-04-13') },
//   { id: 2200000000, date: new Date('2021-01-01') },
//   { id: 3400000000, date: new Date('2022-01-01') },
//   { id: 5000000000, date: new Date('2023-01-01') },
//   { id: 6984356782, date: new Date('2024-01-01') },
//   { id: 7266007926, date: new Date('2024-07-13') },
// ];

// function estimateAccountCreationDate(userId) {
//   for (let i = 0; i < knownIds.length - 1; i++) {
//     if (userId < knownIds[i + 1].id) {
//       const idRange = knownIds[i + 1].id - knownIds[i].id;
//       const dateRange = knownIds[i + 1].date - knownIds[i].date;
//       const relativePosition = (userId - knownIds[i].id) / idRange;
//       const estimatedDate = new Date(knownIds[i].date.getTime() + relativePosition * dateRange);
//       return estimatedDate;
//     }
//   }
//   const lastKnown = knownIds[knownIds.length - 1];
//   const additionalDays = (userId - lastKnown.id) / (100000000 / 365);
//   const estimatedDate = new Date(lastKnown.date.getTime() + additionalDays * 24 * 60 * 60 * 1000);
//   return estimatedDate;
// }

// function calculateCoins(accountCreationDate) {
//   const currentYear = new Date().getFullYear();
//   const accountYear = accountCreationDate.getFullYear();
//   const yearsOld = currentYear - accountYear;
//   return yearsOld * 500;
// }

// app.post('/get-coins', (req, res) => {
//   const { userId } = req.body;
//   const accountCreationDate = estimateAccountCreationDate(userId);
//   const coins = calculateCoins(accountCreationDate);
//   res.json({ coins });
// });

// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const appUrl = `https://66942d3b2f83d300087b198f--magical-basbousa-2be9a4.netlify.app/?userId=${userId}`;

//   bot.sendMessage(chatId, 'Запустить приложение', {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: 'Играть', web_app: { url: appUrl } }]
//       ]
//     }
//   });
// });

// app.listen(port, () => {
//   console.log(`Сервер работает на порту ${port}`);
// });


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const UserProgress = require('./models/userProgress');

const app = express();
const port = process.env.PORT || 3001;
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB подключен'))
    .catch(err => console.log(err));

const knownIds = [
    { id: 3226119, date: new Date('2013-11-29') },
    { id: 10000000, date: new Date('2014-01-01') },
    { id: 22616448, date: new Date('2014-02-25') },
    { id: 48233544, date: new Date('2014-06-16') },
    { id: 84212258, date: new Date('2014-11-13') },
    { id: 90821803, date: new Date('2014-12-09') },
    { id: 50000000, date: new Date('2015-01-01') },
    { id: 125351604, date: new Date('2015-04-22') },
    { id: 163936808, date: new Date('2015-09-10') },
    { id: 184149163, date: new Date('2015-11-19') },
    { id: 100000000, date: new Date('2016-01-01') },
    { id: 217434958, date: new Date('2016-03-08') },
    { id: 251436845, date: new Date('2016-06-22') },
    { id: 289640704, date: new Date('2016-10-12') },
    { id: 293503454, date: new Date('2016-10-23') },
    { id: 309204290, date: new Date('2016-12-06') },
    { id: 328943629, date: new Date('2017-01-28') },
    { id: 335804205, date: new Date('2017-02-15') },
    { id: 348700983, date: new Date('2017-03-20') },
    { id: 349917088, date: new Date('2017-03-23') },
    { id: 378640353, date: new Date('2017-06-02') },
    { id: 415465792, date: new Date('2017-08-26') },
    { id: 450868246, date: new Date('2017-11-11') },
    { id: 454065520, date: new Date('2017-11-17') },
    { id: 495852818, date: new Date('2018-02-09') },
    { id: 530265287, date: new Date('2018-04-14') },
    { id: 561009411, date: new Date('2018-06-06') },
    { id: 597295643, date: new Date('2018-08-04') },
    { id: 660554478, date: new Date('2018-11-06') },
    { id: 727060329, date: new Date('2019-02-02') },
    { id: 817733887, date: new Date('2019-05-17') },
    { id: 840392776, date: new Date('2019-06-10') },
    { id: 895758728, date: new Date('2019-08-04') },
    { id: 942381636, date: new Date('2019-09-18') },
    { id: 1000000000, date: new Date('2020-01-01') },
    { id: 1170401681, date: new Date('2020-04-13') },
    { id: 2200000000, date: new Date('2021-01-01') },
    { id: 3400000000, date: new Date('2022-01-01') },
    { id: 5000000000, date: new Date('2023-01-01') },
    { id: 6984356782, date: new Date('2024-01-01') },
    { id: 7266007926, date: new Date('2024-07-13') },

];

function estimateAccountCreationDate(userId) {
  for (let i = 0; i < knownIds.length - 1; i++) {
        if (userId < knownIds[i + 1].id) {
          const idRange = knownIds[i + 1].id - knownIds[i].id;
          const dateRange = knownIds[i + 1].date - knownIds[i].date;
          const relativePosition = (userId - knownIds[i].id) / idRange;
          const estimatedDate = new Date(knownIds[i].date.getTime() + relativePosition * dateRange);
          return estimatedDate;
        }
      }
      const lastKnown = knownIds[knownIds.length - 1];
      const additionalDays = (userId - lastKnown.id) / (100000000 / 365);
      const estimatedDate = new Date(lastKnown.date.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      return estimatedDate;
}

function calculateCoins(accountCreationDate, hasTelegramPremium) {
  const currentYear = new Date().getFullYear();
  const accountYear = accountCreationDate.getFullYear();
  const yearsOld = currentYear - accountYear;
  const baseCoins = yearsOld * 500;
  return hasTelegramPremium ? baseCoins * 1.5 : baseCoins;
}

async function checkTelegramPremium(userId) {
  // Логика для проверки наличия Telegram Premium у пользователя.
  return false;
}

app.post('/get-coins', async (req, res) => {
  const { userId } = req.body;
  const accountCreationDate = estimateAccountCreationDate(userId);
  const hasTelegramPremium = await checkTelegramPremium(userId);
  const coins = calculateCoins(accountCreationDate, hasTelegramPremium);

  try {
    let user = await UserProgress.findOne({ telegramId: userId });
    if (!user) {
      user = new UserProgress({ telegramId: userId, coins });
      await user.save();
    } else {
      user.coins = coins;
      await user.save();
    }
    res.json({ coins: user.coins });
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/get-user-data', async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await UserProgress.findOne({ telegramId: userId });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({
      coins: user.coins,
      telegramId: user.telegramId
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const accountCreationDate = estimateAccountCreationDate(userId);
  const hasTelegramPremium = await checkTelegramPremium(userId);
  const coins = calculateCoins(accountCreationDate, hasTelegramPremium);

  try {
    let user = await UserProgress.findOne({ telegramId: userId });
    if (!user) {
      user = new UserProgress({ telegramId: userId, coins });
      await user.save();
    } else {
      user.coins = coins;
      await user.save();
    }
    const appUrl = `https://66943e36f96f9c0008c738ab--magical-basbousa-2be9a4.netlify.app/?userId=${userId}`;
    bot.sendMessage(chatId, 'Запустить приложение', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Играть', web_app: { url: appUrl } }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при создании пользователя.');
  }
});

app.listen(port, () => {
  console.log(`Сервер работает на порту ${port}`);
});
