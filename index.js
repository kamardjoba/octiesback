const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const path = require('path');
const UserProgress = require('./models/userProgress');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const MONGODB_URL = 'mongodb+srv://nazarlymar152:Nazar5002Nazar@cluster0.ht9jvso.mongodb.net/Clicker_bot?retryWrites=true&w=majority&appName=Cluster0';
const CHANNEL_ID = -1002187857390;
const CHANNEL_ID_2 = -1002088709942;  

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
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

const generateReferralCode = () => Math.random().toString(36).substr(2, 9);
const generateTelegramLink = (referralCode) => `https://t.me/Octies_bot?start=${referralCode}`;

updateUsersWithFirstNames().then(() => {
  console.log('Все пользователи обновлены');
}).catch(err => {
  console.error('Ошибка при обновлении пользователей:', err);
});

async function updateUsersWithFirstNames() {
  const users = await UserProgress.find({ firstName: { $exists: false } });
  for (let user of users) {
    const chatMember = await bot.getChatMember(CHANNEL_ID, user.telegramId);
    const firstName = chatMember.user.first_name || 'Anonymous';
    user.firstName = firstName;
    await user.save();
  }
}

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

function calculateCoins(accountCreationDate, hasTelegramPremium, subscriptions) {
  const currentYear = new Date().getFullYear();
  const accountYear = accountCreationDate.getFullYear();
  const yearsOld = currentYear - accountYear;
  const baseCoins = yearsOld * 500;
  const premiumBonus = hasTelegramPremium ? 500 : 0;
  const subscriptionBonus1 = subscriptions.isSubscribedToChannel1 ? 1000 : 0;
  const subscriptionBonus2 = subscriptions.isSubscribedToChannel2 ? 750 : 0;
  return baseCoins + premiumBonus + subscriptionBonus1 + subscriptionBonus2;
}

async function checkChannelSubscription(telegramId) {
  try {
    const response1 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID,
        user_id: telegramId
      }
    });

    const response2 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID_2,
        user_id: telegramId
      }
    });

    const status1 = response1.data.result.status;
    const status2 = response2.data.result.status;

    const isSubscribedToChannel1 = ['member', 'administrator', 'creator'].includes(status1);
    const isSubscribedToChannel2 = ['member', 'administrator', 'creator'].includes(status2);

    return { isSubscribedToChannel1, isSubscribedToChannel2 };
  } catch (error) {
    console.error('Ошибка при проверке подписки на канал:', error);
    return { isSubscribedToChannel1: false, isSubscribedToChannel2: false };
  }
}

async function checkTelegramPremium(userId) {
  try {
    const chatMember = await bot.getChatMember(CHANNEL_ID, userId);
    console.log('chatMember:', chatMember);
    return chatMember.user.is_premium;
  } catch (error) {
    console.error('Ошибка при проверке Telegram Premium:', error);
    return false;
  }
}

app.get('/user-count', async (req, res) => {
  try {
    const count = await UserProgress.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Ошибка при получении количества пользователей:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/generate-referral', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await UserProgress.findOne({ telegramId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }

    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = generateReferralCode();
      user.referralCode = referralCode;
      await user.save();
    }

    const telegramLink = generateTelegramLink(referralCode);

    res.json({ success: true, referralCode, telegramLink });
  } catch (error) {
    console.error('Ошибка при генерации реферального кода:', error);
    res.status(500).json({ success: false, message: 'Ошибка при генерации реферального кода.' });
  }
});

app.post('/check-subscription', async (req, res) => {
  const { userId } = req.body;

  try {
    const subscriptions = await checkChannelSubscription(userId);
    let user = await UserProgress.findOne({ telegramId: userId });
    if (user) {
      if (subscriptions.isSubscribedToChannel1 && !user.hasCheckedSubscription) {
        user.coins += 1000; // Добавляем награду за подписку на первый канал
        user.hasCheckedSubscription = true;
      }
      if (subscriptions.isSubscribedToChannel2 && !user.hasCheckedSubscription2) {
        user.coins += 750; // Добавляем награду за подписку на второй канал
        user.hasCheckedSubscription2 = true;
      }
      await user.save();
    } else {
      user = new UserProgress({ telegramId: userId, coins: 1000, hasCheckedSubscription: subscriptions.isSubscribedToChannel1, hasCheckedSubscription2: subscriptions.isSubscribedToChannel2 });
      await user.save();
    }
    res.json({ subscriptions });
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/add-referral', async (req, res) => {
  const { referrerCode, referredId } = req.body;

  try {
    const referrer = await UserProgress.findOne({ referralCode: referrerCode });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Пригласивший пользователь не найден.' });
    }

    const referredUser = await UserProgress.findOne({ telegramId: referredId });
    if (referredUser) {
      return res.status(400).json({ success: false, message: 'Пользователь уже зарегистрирован.' });
    }

    const newUser = new UserProgress({ telegramId: referredId, coins: 500 });
    await newUser.save();

    const referralBonus = Math.floor(newUser.coins * 0.1);

    if (!referrer.referredUsers) {
      referrer.referredUsers = [];
    }

    referrer.referredUsers.push({ nickname: `user_${referredId}`, earnedCoins: referralBonus });
    referrer.coins += referralBonus;
    await referrer.save();

    res.json({ success: true, message: 'Реферал добавлен и монеты начислены.' });
  } catch (error) {
    console.error('Ошибка при добавлении реферала:', error);
    res.status(500).json({ success: false, message: 'Ошибка при добавлении реферала.' });
  }
});

app.post('/check-subscription-and-update', async (req, res) => {
  const { userId } = req.body;

  try {
    const subscriptions = await checkChannelSubscription(userId);
    let user = await UserProgress.findOne({ telegramId: userId });
    const referralCoins = user.referredUsers.reduce((acc, ref) => acc + ref.earnedCoins, 0);
    const totalCoins = user.coins + referralCoins;
    if (user) {
      if (subscriptions.isSubscribedToChannel1 && !user.hasCheckedSubscription) {
        user.coins += 1000; // Добавляем награду за подписку на первый канал
        user.hasCheckedSubscription = true;
      } else if (!subscriptions.isSubscribedToChannel1 && user.hasCheckedSubscription) {
        user.coins -= 1000; // Вычитаем монеты за отписку от первого канала
        user.hasCheckedSubscription = false;
      }
      if (subscriptions.isSubscribedToChannel2 && !user.hasCheckedSubscription2) {
        user.coins += 750; // Добавляем награду за подписку на второй канал
        user.hasCheckedSubscription2 = true;
      } else if (!subscriptions.isSubscribedToChannel2 && user.hasCheckedSubscription2) {
        user.coins -= 750; // Вычитаем монеты за отписку от второго канала
        user.hasCheckedSubscription2 = false;
      }
      await user.save();
      res.json({ success: true, coins: totalCoins, hasCheckedSubscription: user.hasCheckedSubscription,
        hasCheckedSubscription2: user.hasCheckedSubscription2 });
    } else {
      res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/get-referred-users', async (req, res) => {
  const { referralCode } = req.body;

  try {
    const user = await UserProgress.findOne({ referralCode });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }

    res.json({ success: true, referredUsers: user.referredUsers });
  } catch (error) {
    console.error('Ошибка при получении данных о рефералах:', error);
    res.status(500).json({ success: false, message: 'Ошибка при получении данных о рефералах.' });
  }
});

app.post('/get-coins', async (req, res) => {
  const { userId } = req.body;
  const accountCreationDate = estimateAccountCreationDate(userId);

  try {
    const hasTelegramPremium = await checkTelegramPremium(userId);
    const subscriptions = await checkChannelSubscription(userId);

    const chatMember = await bot.getChatMember(CHANNEL_ID, userId);
    const firstName = chatMember.user.first_name || 'Anonymous'; // Используем first_name или задаем "Anonymous"
    const nickname = chatMember.user.username || `user_${userId}`; // Используем username или генерируем никнейм

    let user = await UserProgress.findOne({ telegramId: userId });
    const referralCoins = user.referredUsers.reduce((acc, ref) => acc + ref.earnedCoins, 0);
    const totalCoins = user.coins + referralCoins;
    if (!user) {
      const coins = calculateCoins(accountCreationDate, hasTelegramPremium, subscriptions);
      user = new UserProgress({ telegramId: userId, nickname, firstName, coins, hasTelegramPremium, hasCheckedSubscription: subscriptions.isSubscribedToChannel1, hasCheckedSubscription2: subscriptions.isSubscribedToChannel2 });
      await user.save();
    } else {
      const coins = calculateCoins(accountCreationDate, hasTelegramPremium, subscriptions);
      const fullCoins = coins + referralCoins;
      user.coins = fullCoins;
      user.nickname = nickname;
      user.firstName = firstName; // Обновляем имя
      user.hasTelegramPremium = hasTelegramPremium;
      user.hasCheckedSubscription = subscriptions.isSubscribedToChannel1;
      user.hasCheckedSubscription2 = subscriptions.isSubscribedToChannel2;
      await user.save();
    }

    res.json({
      coins: totalCoins,
      referralCoins: referralCoins, // Добавляем общее количество монет за рефералов в ответ
      hasTelegramPremium: user.hasTelegramPremium,
      hasCheckedSubscription: user.hasCheckedSubscription,
      hasCheckedSubscription2: user.hasCheckedSubscription2,
      accountCreationDate: accountCreationDate.toISOString()
    });
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/user-rank', async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await UserProgress.findOne({ telegramId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }

    const rank = await UserProgress.countDocuments({ coins: { $gt: user.coins } }) + 1;
    res.json({ success: true, rank, nickname: user.nickname });
  } catch (error) {
    console.error('Ошибка при получении позиции пользователя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const users = await UserProgress.find({});

    const leaderboard = users.map(user => ({
      _id: user._id,
      nickname: user.nickname,
      coins: user.coins
    })).sort((a, b) => b.coins - a.coins).slice(0, 50);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Ошибка при получении данных лидерборда:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
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
      telegramId: user.telegramId,
      hasTelegramPremium: user.hasTelegramPremium,
      hasCheckedSubscription: user.hasCheckedSubscription,
      hasCheckedSubscription2: user.hasCheckedSubscription2
    });
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

async function sendMessageToAllUsers(message, buttonText, buttonUrl, buttonType) {
    try {
      const users = await UserProgress.find({}, 'telegramId');
  
      const promises = users.map(user => {
        if (message.text) {
          if (buttonText && buttonUrl) {
            const replyMarkup = buttonType === 'web_app' ? 
              { inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]] } : 
              { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] };
  
            return bot.sendMessage(user.telegramId, message.text, { reply_markup: replyMarkup });
          } else {
            return bot.sendMessage(user.telegramId, message.text);
          }
        } else if (message.photo) {
          const photo = message.photo[message.photo.length - 1].file_id;
          const caption = message.caption || '';
          if (buttonText && buttonUrl) {
            const replyMarkup = buttonType === 'web_app' ? 
              { inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]] } : 
              { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] };
  
            return bot.sendPhoto(user.telegramId, photo, { caption, reply_markup: replyMarkup });
          } else {
            return bot.sendPhoto(user.telegramId, photo, { caption });
          }
        }
      });
  
      await Promise.all(promises);
    } catch (error) {
      console.error('Ошибка при отправке сообщений:', error);
    }
  }
  

const ADMIN_IDS = [561009411]; // Замени на реальные Telegram ID администраторов

bot.onText(/\/broadcast/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
  
    if (!ADMIN_IDS.includes(userId)) {
      return bot.sendMessage(chatId, 'У вас нет прав для использования этой команды.');
    }
  
    userStates[userId] = { state: 'awaiting_message' };
    bot.sendMessage(chatId, 'Пожалуйста, отправьте сообщение или фото, которое вы хотите разослать всем пользователям.');
  });
  

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
  
    if (userStates[userId] && userStates[userId].state === 'awaiting_message') {
      userStates[userId].message = msg;
      userStates[userId].state = 'awaiting_button_choice';
  
      bot.sendMessage(chatId, 'Вы хотите добавить инлайн кнопку? Отправьте "да" или "нет".');
    } else if (userStates[userId] && userStates[userId].state === 'awaiting_button_choice') {
      if (msg.text.toLowerCase() === 'да') {
        userStates[userId].state = 'awaiting_button_text';
        bot.sendMessage(chatId, 'Пожалуйста, отправьте текст для инлайн кнопки.');
      } else {
        await sendMessageToAllUsers(userStates[userId].message);
        delete userStates[userId];
        bot.sendMessage(chatId, 'Сообщение успешно отправлено всем пользователям.');
      }
    } else if (userStates[userId] && userStates[userId].state === 'awaiting_button_text') {
      userStates[userId].buttonText = msg.text;
      userStates[userId].state = 'awaiting_button_url';
      bot.sendMessage(chatId, 'Пожалуйста, отправьте URL для инлайн кнопки.');
    } else if (userStates[userId] && userStates[userId].state === 'awaiting_button_url') {
      userStates[userId].buttonUrl = msg.text;
      userStates[userId].state = 'awaiting_button_type';
      bot.sendMessage(chatId, 'Какого типа будет кнопка? Отправьте "web_app" или "url".');
    } else if (userStates[userId] && userStates[userId].state === 'awaiting_button_type') {
      userStates[userId].buttonType = msg.text.toLowerCase();
  
      await sendMessageToAllUsers(userStates[userId].message, userStates[userId].buttonText, userStates[userId].buttonUrl, userStates[userId].buttonType);
      delete userStates[userId];
      bot.sendMessage(chatId, 'Сообщение с инлайн кнопкой успешно отправлено всем пользователям.');
    }
  });
  
  

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const referrerCode = match[1]; // Может быть undefined, если команда без параметра

  const nickname = msg.from.username || `user_${userId}`;
  const firstName = msg.from.first_name || 'Anonymous';
  const accountCreationDate = estimateAccountCreationDate(userId);
  const hasTelegramPremium = await checkTelegramPremium(userId);
  const isSubscribed = await checkChannelSubscription(userId);
  const coins = calculateCoins(accountCreationDate, hasTelegramPremium, isSubscribed);

  try {
    let user = await UserProgress.findOne({ telegramId: userId });
    const isNewUser = !user;
    if (isNewUser) {
      const referralCode = generateReferralCode();
      user = new UserProgress({ telegramId: userId, nickname, firstName, coins, hasTelegramPremium, hasCheckedSubscription: isSubscribed, referralCode });
      await user.save();
    } else {
      const referralCoins = user.referredUsers.reduce((acc, ref) => acc + ref.earnedCoins, 0);
      user.coins = coins + referralCoins;
      user.nickname = nickname;
      user.firstName = firstName;
      user.hasTelegramPremium = hasTelegramPremium;
      user.hasCheckedSubscription = isSubscribed;
      await user.save();
    }

    // Если есть реферальный код и пользователь новый, проверяем код и добавляем реферала
    if (referrerCode && isNewUser) {
      if (referrerCode === user.referralCode) {
        bot.sendMessage(chatId, 'Вы не можете использовать свою собственную реферальную ссылку.');
      } else {
        const referrer = await UserProgress.findOne({ referralCode: referrerCode });
        if (referrer) {
          const referralBonus = Math.floor(user.coins * 0.1);
          referrer.referredUsers.push({ nickname, earnedCoins: referralBonus });
          referrer.coins += referralBonus;
          await referrer.save();
        }
      }
    }

   const appUrl = `https://bomboklad.online?userId=${userId}`;
   const channelUrl = `https://t.me/octies_channel`;

   const imagePath = path.join(__dirname, 'images', 'Octies_bot_logo.png');
    
   console.log(`Sending photo from path: ${imagePath}`);
   await bot.sendPhoto(chatId, imagePath, {
     caption: "How cool is your Telegram profile? Check your rating and receive rewards 🐙",
     reply_markup: {
       inline_keyboard: [
         [
           { text: "Let's Go!", web_app: { url: appUrl } },
           { text: 'Join OCTIES Community', url: channelUrl }
         ]
       ]
     }
   }).then(() => {
     console.log('Photo and buttons sent successfully');
   }).catch((err) => {
     console.error('Error sending photo and buttons:', err);
   });

 } catch (error) {
   console.error('Ошибка при создании пользователя:', error);
   bot.sendMessage(chatId, 'Произошла ошибка при создании пользователя.');
 }
});

app.listen(port, () => {
  console.log(`Сервер работает на порту ${port}`);
});













