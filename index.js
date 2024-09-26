require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const redis = require('redis');
const client = redis.createClient();
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const UserProgress = require('./models/userProgress');
const Spots = require('./models/Spots');
//const GlobalTransactionCounter = require('./models/GlobalTransactionCounter');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3001;
const token = '7218535993:AAEKWj9VqAxp-kcH7boFDkDoiTXGBjQzEIQ';
const bot = new TelegramBot(token, { polling: true });
const CHANNEL_ID = -1002234145528; 
const CHANNEL_ID_2 =-1002088709942;
const CHANNEL_ID_3 =-1002208556196; 
const CHANNEL_ID_4 =-1002246870197; 

const userStates = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

client.on('error', (err) => {
  console.error('Ошибка подключения к Redis:', err);
});
    
client.on('connect', () => {
   console.log('Подключение к Redis успешно!');
});

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
    { id: 7840211863, date: new Date('2024-09-23') }

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
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
  
    // Проверяем, если аккаунт был создан менее года назад
    if (accountCreationDate > oneYearAgo) {
      return 300;
    }
  
    const currentYear = currentDate.getFullYear();
    const accountYear = accountCreationDate.getFullYear();
    const yearsOld = currentYear - accountYear;
    const baseCoins = yearsOld * 500;
    const premiumBonus = hasTelegramPremium ? 500 : 0;
    const subscriptionBonus1 = subscriptions.isSubscribedToChannel1 ? 1000 : 0;
    const subscriptionBonus2 = subscriptions.isSubscribedToChannel2 ? 750 : 0;
    const subscriptionBonus3 = subscriptions.isSubscribedToChannel3 ? 750 : 0;
    const subscriptionBonus4 = subscriptions.isSubscribedToChannel4 ? 750 : 0;
   
    return baseCoins + premiumBonus + subscriptionBonus1 + subscriptionBonus2 + subscriptionBonus3 + subscriptionBonus4;
  }
  
// async function checkChannelSubscription(telegramId) {
//   try {
//     const response1 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
//       params: {
//         chat_id: CHANNEL_ID,
//         user_id: telegramId
//       }
//     });

//     const response2 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
//       params: {
//         chat_id: CHANNEL_ID_2,
//         user_id: telegramId
//       }
//     });

//     const response3 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
//         params: {
//           chat_id: CHANNEL_ID_3,
//           user_id: telegramId
//         }
//     });

//     const response4 = await axios.get(`https://api.telegram.org/bot${token}/getChatMember`, {
//         params: {
//           chat_id: CHANNEL_ID_4,
//           user_id: telegramId
//         }
//       });


//     const status1 = response1.data.result.status;
//     const status2 = response2.data.result.status;
//     const status3 = response3.data.result.status;
//     const status4 = response4.data.result.status;

//     const isSubscribedToChannel1 = ['member', 'administrator', 'creator'].includes(status1);
//     const isSubscribedToChannel2 = ['member', 'administrator', 'creator'].includes(status2);
//     const isSubscribedToChannel3 = ['member', 'administrator', 'creator'].includes(status3);
//     const isSubscribedToChannel4 = ['member', 'administrator', 'creator'].includes(status4);

//     return { isSubscribedToChannel1, isSubscribedToChannel2, isSubscribedToChannel3, isSubscribedToChannel4 };
//   } catch (error) {
//     console.error('Ошибка при проверке подписки на канал:', error);
//     return { isSubscribedToChannel1: false, isSubscribedToChannel2: false, isSubscribedToChannel3: false, isSubscribedToChannel4: false };
//   }
// }

async function checkChannelSubscription(userId) {
  try {
    // Все запросы к API Telegram
    const [response1, response2, response3, response4] = await Promise.all([
      axios.get(`https://api.telegram.org/bot${token}/getChatMember`, { params: { chat_id: CHANNEL_ID, user_id: userId } }),
      axios.get(`https://api.telegram.org/bot${token}/getChatMember`, { params: { chat_id: CHANNEL_ID_2, user_id: userId } }),
      axios.get(`https://api.telegram.org/bot${token}/getChatMember`, { params: { chat_id: CHANNEL_ID_3, user_id: userId } }),
      axios.get(`https://api.telegram.org/bot${token}/getChatMember`, { params: { chat_id: CHANNEL_ID_4, user_id: userId } })
    ]);

    // Проверка статусов
    const isSubscribedToChannel1 = ['member', 'administrator', 'creator'].includes(response1.data.result.status);
    const isSubscribedToChannel2 = ['member', 'administrator', 'creator'].includes(response2.data.result.status);
    const isSubscribedToChannel3 = ['member', 'administrator', 'creator'].includes(response3.data.result.status);
    const isSubscribedToChannel4 = ['member', 'administrator', 'creator'].includes(response4.data.result.status);

    return { isSubscribedToChannel1, isSubscribedToChannel2, isSubscribedToChannel3, isSubscribedToChannel4 };
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return { isSubscribedToChannel1: false, isSubscribedToChannel2: false, isSubscribedToChannel3: false, isSubscribedToChannel4: false };
  }
}

// Маршрут для проверки подписки
app.post('/check-subscription', async (req, res) => {
  const { userId } = req.body;  // Получаем userId из тела запроса
  if (!userId) {
    return res.status(400).json({ error: 'Не указан userId' });
  }

  try {
    const result = await checkChannelSubscription(userId);
    res.json(result);  // Возвращаем результат проверки
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


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

// Функция для проверки никнейма и награды
const checkNicknameAndReward = async (userId) => {
    try {
        const user = await UserProgress.findOne({ telegramId: userId });

        if (!user) {
            console.log('Пользователь не найден.');
            return;
        }

        // Проверяем, был ли бонус уже обработан во время текущего запроса
        if (user.processingNicknameBonus) {
            console.log('Бонус за никнейм уже обрабатывается.');
            return;
        }

        // Устанавливаем флаг, что бонус обрабатывается
        user.processingNicknameBonus = true;
        await user.save();

        const hasOctiesInNickname = user.firstName.includes('Octies');

        if (hasOctiesInNickname && !user.hasNicknameBonus) {
            // Пользователь еще не получил бонус и у него есть "octies" в нике
            user.coins += 300;
            user.hasNicknameBonus = true;
            console.log(`Пользователю ${user.firstName} начислено 569 монет за ник с "octies".`);
        } else if (!hasOctiesInNickname && user.hasNicknameBonus) {
            // Пользователь удалил "octies" из ника, но ранее получил бонус
            user.coins -= 300;
            user.hasNicknameBonus = false;
            console.log(`Пользователю ${user.firstName} снято 569 монет за удаление "octies" из ника.`);
         }
        // else {
        //     console.log(`Нет изменений в нике или бонус уже был обработан.`);
        // }

        // Сбрасываем флаг после завершения обработки
        user.processingNicknameBonus = false;
        await user.save();
    } catch (error) {
        console.error('Ошибка при проверке ника и обработке монет:', error);
    }
};

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
      if (subscriptions.isSubscribedToChannel3 && !user.hasCheckedSubscription3) {
        user.coins += 750; // Добавляем награду за подписку на второй канал
        user.hasCheckedSubscription3 = true;
      }
      if (subscriptions.isSubscribedToChannel4 && !user.hasCheckedSubscription4) {
        user.coins += 750; // Добавляем награду за подписку на второй канал
        user.hasCheckedSubscription4 = true;
      }
      await user.save();
    } else {
      user = new UserProgress({ telegramId: userId, coins: 1000, hasCheckedSubscription: subscriptions.isSubscribedToChannel1, hasCheckedSubscription2: subscriptions.isSubscribedToChannel2, hasCheckedSubscription3: subscriptions.isSubscribedToChannel3, hasCheckedSubscription4: subscriptions.isSubscribedToChannel4 });
      await user.save();
    }
    res.json({ subscriptions });
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/record-transaction', async (req, res) => {
  const { userId } = req.body;

  try {
      // Находим пользователя по его ID
      let user = await UserProgress.findOne({ telegramId: userId });
      
      if (!user) {
          return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
      }

      // Увеличиваем счетчик транзакций у всех пользователей
      await UserProgress.updateMany({}, { $inc: { transactionNumber: 1 } });

      // Устанавливаем текущему пользователю transactionNumber равный 1
      user.transactionNumber = 1;

      // Сохраняем изменения в базе данных
      await user.save();

      // Возвращаем номер транзакции
      res.json({ success: true, transactionNumber: user.transactionNumber });
  } catch (error) {
      console.error('Ошибка при записи транзакции:', error);
      res.status(500).json({ success: false, message: 'Ошибка при записи транзакции.' });
  }
});

app.post('/transaction-success', async (req, res) => {
  try {
      // Получаем текущее состояние из базы данных
      let spots = await Spots.findOne();
      
      // Если данных нет, создаем запись
      if (!spots) {
          spots = new Spots({ availableSpots: 250 });
      }

      // Уменьшаем количество свободных мест
      if (spots.availableSpots > 0) {
          spots.availableSpots -= 1;
      }

      // Сохраняем обновленное состояние в базу данных
      await spots.save();

      // Отправляем обновленное количество мест клиенту
      res.json({ success: true, availableSpots: spots.availableSpots });
  } catch (error) {
      console.error('Ошибка при обновлении количества мест:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/special-transaction-success', async (req, res) => {
  try {
      const { userId } = req.body;

     
      let user = await UserProgress.findOne({ telegramId: userId });

      if (!user) {
          return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
      }

      
      user.specialTransactionCounter += 1;

     
      await user.save();

      res.json({ success: true, message: 'Special transaction counter updated successfully.' });
  } catch (error) {
      console.error('Ошибка при обновлении специального счетчика транзакций:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.get('/current-spots', async (req, res) => {
  try {
      // Получаем текущее состояние из базы данных
      const spots = await Spots.findOne();

      // Если данных нет, возвращаем значение по умолчанию
      const availableSpots = spots ? spots.availableSpots : 250;

      res.json({ success: true, availableSpots });
  } catch (error) {
      console.error('Ошибка при получении количества мест:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/get-referral-count', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await UserProgress.findOne({ telegramId: userId });

        if (user) {
            const referralCount = user.referredUsers.length;
            res.status(200).json({ referralCount });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
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

app.post('/update-coins', async (req, res) => {
  const { userId, amount } = req.body;

  try {
      let user = await UserProgress.findOne({ telegramId: userId });
      if (user) {
          user.coins += amount;

          // Установите флаг hasReceivedTwitterReward в true, если пользователь получил награду
          if (amount === 500) {
              user.hasReceivedTwitterReward = true;
          }

          await user.save();
          res.json({ success: true, coins: user.coins, hasReceivedTwitterReward: user.hasReceivedTwitterReward });
      } else {
          res.status(404).json({ success: false, message: 'Пользователь не найден.' });
      }
  } catch (error) {
      console.error('Ошибка при обновлении монет:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/update-coins-bot', async (req, res) => {
  const { userId, amount } = req.body;

  try {
      let user = await UserProgress.findOne({ telegramId: userId });
      if (user) {
          user.coins += amount;

          // Установите флаг hasReceivedTwitterReward в true, если пользователь получил награду
          if (amount === 750) {
              user.hasBotSub = true;
          }

          await user.save();
          res.json({ success: true, coins: user.coins, hasBotSub: user.hasBotSub });
      } else {
          res.status(404).json({ success: false, message: 'Пользователь не найден.' });
      }
  } catch (error) {
      console.error('Ошибка при обновлении монет:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

app.post('/check-subscription-and-update', async (req, res) => {
    const { userId } = req.body;

    try {
        const subscriptions = await checkChannelSubscription(userId);
        let user = await UserProgress.findOne({ telegramId: userId });

        if (user) {
            let updatedCoins = user.coins;
            let updatedCoinsSub = user.coinsSub;

            await checkNicknameAndReward(userId);

            // Проверка подписки на первый канал
            if (subscriptions.isSubscribedToChannel1 && !user.hasCheckedSubscription) {
                updatedCoins += 1000; // Добавляем награду за подписку на первый канал
                user.hasCheckedSubscription = true;
            } else if (!subscriptions.isSubscribedToChannel1 && user.hasCheckedSubscription) {
                updatedCoins -= 1000; // Вычитаем монеты за отписку от первого канала
                user.hasCheckedSubscription = false;
            }
            // Проверка подписки на второй канал
            if (subscriptions.isSubscribedToChannel2 && !user.hasCheckedSubscription2) {
                updatedCoins += 750; // Добавляем награду за подписку на второй канал
                updatedCoinsSub += 750; // Сохраняем монеты за подписку в отдельное поле
                user.hasCheckedSubscription2 = true;
            } else if (!subscriptions.isSubscribedToChannel2 && user.hasCheckedSubscription2) {
                updatedCoins -= 750; // Вычитаем монеты за отписку от второго канала
                updatedCoinsSub -= 750; // Вычитаем монеты за отписку в отдельное поле
                user.hasCheckedSubscription2 = false;
            }

            // Проверка подписки на третий канал
            if (subscriptions.isSubscribedToChannel3 && !user.hasCheckedSubscription3) {
                updatedCoins += 750; // Добавляем награду за подписку на третий канал
                updatedCoinsSub += 750; // Сохраняем монеты за подписку в отдельное поле
                user.hasCheckedSubscription3 = true;
            } else if (!subscriptions.isSubscribedToChannel3 && user.hasCheckedSubscription3) {
                updatedCoins -= 750; // Вычитаем монеты за отписку от третьего канала
                updatedCoinsSub -= 750; // Вычитаем монеты за отписку в отдельное поле
                user.hasCheckedSubscription3 = false;
            }

            // Проверка подписки на четвертый канал
            if (subscriptions.isSubscribedToChannel4 && !user.hasCheckedSubscription4) {
                updatedCoins += 750; // Добавляем награду за подписку на четвертый канал
                updatedCoinsSub += 750; // Сохраняем монеты за подписку в отдельное поле
                user.hasCheckedSubscription4 = true;
            } else if (!subscriptions.isSubscribedToChannel4 && user.hasCheckedSubscription4) {
                updatedCoins -= 750; // Вычитаем монеты за отписку от четвертого канала
                updatedCoinsSub -= 750; // Вычитаем монеты за отписку в отдельное поле
                user.hasCheckedSubscription4 = false;
            }
          
            user.coins = updatedCoins;
            user.coinsSub = updatedCoinsSub;
            await user.save();

            res.json({
                success: true,
                coins: updatedCoins,
                coinsSub: updatedCoinsSub,
                hasCheckedSubscription: user.hasCheckedSubscription,
                hasCheckedSubscription2: user.hasCheckedSubscription2,
                hasCheckedSubscription3: user.hasCheckedSubscription3,
                hasCheckedSubscription4: user.hasCheckedSubscription4,
                specialTransactionCounter: user.specialTransactionCounter,
                hasNicknameBonus: user.hasNicknameBonus
            });
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

      let user = await UserProgress.findOne({ telegramId: userId });
      if (!user) {
          const coins = calculateCoins(accountCreationDate, hasTelegramPremium, subscriptions);
          user = new UserProgress({
              telegramId: userId,
              coins: coins,
              coinsSub: user.coinsSub,
              hasTelegramPremium: hasTelegramPremium,
              hasCheckedSubscription: subscriptions.isSubscribedToChannel1,
              hasCheckedSubscription2: subscriptions.isSubscribedToChannel2,
              hasCheckedSubscription3: subscriptions.isSubscribedToChannel3,
              hasCheckedSubscription4: subscriptions.isSubscribedToChannel4
          });
          await user.save();
      }

      // Получение актуального никнейма пользователя через Telegram API
      const chatMember = await bot.getChatMember(CHANNEL_ID, userId);
      const firstName = chatMember.user.first_name;

      // Обновляем никнейм пользователя, если он изменился
      if (user.firstName !== firstName) {
          user.firstName = firstName;
          await user.save();
      }

      // Проверяем никнейм и начисляем награду, если необходимо
      await checkNicknameAndReward(userId);
      const hasMintedNFT = user.hasMintedNFT;
      const referralCoins = user.referredUsers.reduce((acc, ref) => acc + ref.earnedCoins, 0);
      const totalCoins = user.coins;
      res.json({
          coins: totalCoins,
          referralCoins: referralCoins,
          coinsSub: user.coinsSub,
          hasTelegramPremium: user.hasTelegramPremium,
          hasCheckedSubscription: user.hasCheckedSubscription,
          hasCheckedSubscription2: user.hasCheckedSubscription2,
          hasCheckedSubscription3: user.hasCheckedSubscription3,
          hasCheckedSubscription4: user.hasCheckedSubscription4,
          hasReceivedTwitterReward: user.hasReceivedTwitterReward,
          hasNicknameBonus: user.hasNicknameBonus,
          specialTransactionCounter: user.specialTransactionCounter,
          hasMintedNFT,
          transactionNumber: user.transactionNumber,
          accountCreationDate: accountCreationDate.toISOString()
      });
  } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
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
    const users = await UserProgress.find({}, { nickname: 1, coins: 1 })
    .sort({ coins: -1 })
    .limit(50);

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

app.post('/get-referral-count', async (req, res) => {
    const { userId } = req.body;
  
    try {
      const user = await UserProgress.findOne({ telegramId: userId });
      if (user) {
        const referralCount = user.referredUsers ? user.referredUsers.length : 0;
        res.json({ success: true, referralCount });
      } else {
        res.status(404).json({ success: false, message: 'User not found.' });
      }
    } catch (error) {
      console.error('Error fetching referral count:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/add-coins', async (req, res) => {
    const { userId, amount } = req.body;
  
    try {
      let user = await UserProgress.findOne({ telegramId: userId });
      if (user) {
        user.coins += amount;
        await user.save();
        res.json({ success: true, coins: user.coins });
      } else {
        res.status(404).json({ success: false, message: 'Пользователь не найден.' });
      }
    } catch (error) {
      console.error('Ошибка при добавлении монет:', error);
      res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// // app.get('/get-user-data', async (req, res) => {
// //   const { userId } = req.query;

// //   try {
// //     const user = await UserProgress.findOne({ telegramId: userId });
// //     if (!user) {
// //       return res.status(404).json({ error: 'Пользователь не найден' });
// //     }
// //     res.json({
// //       coins: user.coins,
// //       telegramId: user.telegramId,
// //       hasTelegramPremium: user.hasTelegramPremium,
// //       hasCheckedSubscription: user.hasCheckedSubscription,
// //       hasCheckedSubscription2: user.hasCheckedSubscription2
// //     });
// //   } catch (error) {
// //     console.error('Ошибка при получении данных пользователя:', error);
// //     res.status(500).json({ error: 'Ошибка сервера' });
// //   }
// // });
// async function sendMessageToAllUsers(message, buttonText) {
//   try {
//     const users = await UserProgress.find({}, 'telegramId');

//     const promises = users.map(user => {
//       if (message.text) {
//         // Отправка текстового сообщения
//         const replyMarkup = {
//           inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
//         };
//         return bot.sendMessage(user.telegramId, message.text, { reply_markup: replyMarkup });
//       } else if (message.photo) {
//         // Отправка фото
//         const photo = message.photo[message.photo.length - 1].file_id;
//         const caption = message.caption || '';
//         const replyMarkup = {
//           inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
//         };
//         return bot.sendPhoto(user.telegramId, photo, { caption, reply_markup: replyMarkup });
//       } else if (message.video) {
//         // Отправка видео
//         const video = message.video.file_id;
//         const caption = message.caption || '';
//         const replyMarkup = {
//           inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
//         };
//         return bot.sendVideo(user.telegramId, video, { caption, reply_markup: replyMarkup });
//       }
//     });

//     await Promise.all(promises);
//   } catch (error) {
//     console.error('Ошибка при отправке сообщений:', error);
//   }
// }

// bot.on('callback_query', async (callbackQuery) => {
//   const message = callbackQuery.message;
//   const userId = callbackQuery.from.id;

//   if (callbackQuery.data === 'start_command') {
   
    
//     // Вызовите функцию, которая отвечает за команду /start
//     handleStartCommand(userId, message.chat.id);
//   }

//   bot.answerCallbackQuery(callbackQuery.id);
// });

// async function handleStartCommand(userId, chatId) {
//   // Ваш код для обработки команды /start
//   const appUrl = `https://octies.org/?userId=${userId}`;
//   const channelUrl = `https://t.me/octies_community`;

//   try {
//     const imagePath = path.join(__dirname, 'images', 'Octies_bot_logo.png');
    
//     await bot.sendPhoto(chatId, imagePath, {
//       caption: "How cool is your Telegram profile? Check your rating and receive rewards 🐙",
//       reply_markup: {
//         inline_keyboard: [
//           [
//             { text: "Let's Go!", web_app: { url: appUrl } },
//             { text: 'Join OCTIES Community', url: channelUrl }
//           ]
//         ]
//       }
//     });
//   } catch (error) {
//     console.error('Ошибка при отправке фото:', error);
//     bot.sendMessage(chatId, 'Произошла ошибка при отправке фото.');
//   }
// }

// const ADMIN_IDS = [561009411]; // Замени на реальные Telegram ID администраторов

// bot.onText(/\/broadcast/, (msg) => {
//     const chatId = msg.chat.id;
//     const userId = msg.from.id;
  
//     if (!ADMIN_IDS.includes(userId)) {
//       return bot.sendMessage(chatId, 'У вас нет прав для использования этой команды.');
//     }
  
//     userStates[userId] = { state: 'awaiting_message' };
//     bot.sendMessage(chatId, 'Пожалуйста, отправьте сообщение или фото, которое вы хотите разослать всем пользователям.');
// });
const sendMessageToAllUsers = async (message, buttonText) => {
  try {
    // Получаем всех пользователей из базы данных
    const users = await UserProgress.find({}, 'telegramId');

    // Устанавливаем размер батча
    const chunkSize = 200; // количество пользователей в одном "батче"

    // Проходим по пользователям батчами
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);

      // Отправляем сообщения пользователям в этом батче
      await Promise.all(chunk.map(async (user) => {
        if (message.text) {
          // Отправка текстового сообщения с кнопкой
          const replyMarkup = {
            inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
          };
          await bot.sendMessage(user.telegramId, message.text, { reply_markup: replyMarkup });
        } else if (message.photo) {
          // Отправка фото с кнопкой
          const photo = message.photo[message.photo.length - 1].file_id;
          const caption = message.caption || '';
          const replyMarkup = {
            inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
          };
          await bot.sendPhoto(user.telegramId, photo, { caption, reply_markup: replyMarkup });
        } else if (message.video) {
          // Отправка видео с кнопкой
          const video = message.video.file_id;
          const caption = message.caption || '';
          const replyMarkup = {
            inline_keyboard: [[{ text: buttonText, callback_data: 'start_command' }]]
          };
          await bot.sendVideo(user.telegramId, video, { caption, reply_markup: replyMarkup });
        }
      }));

      // Пауза 1 секунда между батчами для избежания перегрузки
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщений:', error);
  }
};

bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === 'start_command') {
   
    
    // Вызовите функцию, которая отвечает за команду /start
    handleStartCommand(userId, message.chat.id);
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

async function handleStartCommand(userId, chatId) {
  // Ваш код для обработки команды /start
  const appUrl = `https://octies.org/?userId=${userId}`;
  const channelUrl = `https://t.me/octies_community`;

  try {
    const imagePath = path.join(__dirname, 'images', 'Octies_bot_logo.png');
    
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
    });
  } catch (error) {
    console.error('Ошибка при отправке фото:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при отправке фото.');
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

  
app.post('/save-wallet-address', async (req, res) => {
    const { userId, walletAddress } = req.body;

    console.log(`Запрос на сохранение адреса кошелька: userId=${userId}, walletAddress=${walletAddress}`);
    
    try {
        let user = await UserProgress.findOne({ telegramId: userId });

        if (!user) {
            console.log(`Пользователь с userId=${userId} не найден.`);
            return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
        }

        user.walletAddress = walletAddress;

        await user.save();
        console.log(`Адрес кошелька успешно сохранен для userId=${userId}.`);

        res.json({ success: true, message: 'Адрес кошелька успешно сохранен.' });
    } catch (error) {
        console.error(`Ошибка при сохранении адреса кошелька: ${error.message}`);
        res.status(500).json({ success: false, message: 'Ошибка при сохранении адреса кошелька.' });
    }
});

app.post('/update-mint-status', async (req, res) => {
  const { userId, hasMintedNFT } = req.body;

  try {
    let user = await UserProgress.findOne({ telegramId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }

    user.hasMintedNFT = hasMintedNFT;
    await user.save();

    res.json({ success: true, message: 'Статус mint обновлен успешно.' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса mint:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при обновлении статуса mint.' });
  }
});

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const referrerCode = match[1]; // Может быть undefined, если команда без параметра

  const nickname = msg.from.username || `user_${userId}`;
  const firstName = msg.from.first_name || 'Anonymous';
  const accountCreationDate = estimateAccountCreationDate(userId);
  const [hasTelegramPremium, subscriptions] = await Promise.all([
    checkTelegramPremium(userId),
    checkChannelSubscription(userId)
  ]);

  const coins = calculateCoins(accountCreationDate, hasTelegramPremium, subscriptions);

  try {
    let user = await UserProgress.findOne({ telegramId: userId });
    const isNewUser = !user;
    if (isNewUser) {
      const referralCode = generateReferralCode();
      user = new UserProgress({ telegramId: userId, nickname, firstName, coins, hasTelegramPremium, hasCheckedSubscription: subscriptions.isSubscribedToChannel1, hasCheckedSubscription2: subscriptions.isSubscribedToChannel2, hasCheckedSubscription3: subscriptions.isSubscribedToChannel3, hasCheckedSubscription4: subscriptions.isSubscribedToChannel4,referralCode });
      await user.save();
    } else {
      const referralCoins = user.referredUsers.reduce((acc, ref) => acc + ref.earnedCoins, 0);
      user.coins = coins + referralCoins + user.coinsSub;
      if(user.firstName.includes('Octies')) {
        user.coins += 300;
        user.hasNicknameBonus = true;
      }
      if(user.hasReceivedTwitterReward) {
         user.coins += 500;
      }
      if(user.hasCheckedSubscription){
         user.coins += 1000;
      }
      if(user.hasTelegramPremium){
         user.coins += 500;
      }
     

      user.nickname = nickname;
      user.firstName = firstName;
      user.hasTelegramPremium = hasTelegramPremium;
      user.hasCheckedSubscription = subscriptions.isSubscribedToChannel1;
      user.hasCheckedSubscription2 = subscriptions.isSubscribedToChannel2;
      user.hasCheckedSubscription3 = subscriptions.isSubscribedToChannel3;
      user.hasCheckedSubscription4 = subscriptions.isSubscribedToChannel4;
      await user.save();
    }

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

    const appUrl = `https://octies.org/?userId=${userId}`;
    const channelUrl = `https://t.me/octies_community`;

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
