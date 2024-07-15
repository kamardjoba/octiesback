const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  coins: { type: Number, default: 0 },
  hasTelegramPremium: { type: Boolean, default: false },
  hasCheckedSubscription: { type: Boolean, default: false },
  referralCode: { type: String, unique: true }, // Код реферала
  referredUsers: [{ nickname: String, earnedCoins: Number }]
});

const UserProgress = mongoose.model('Users', UserSchema);

module.exports = UserProgress;

