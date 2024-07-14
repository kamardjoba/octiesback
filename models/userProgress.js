const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  coins: { type: Number, default: 0 }
});

const UserProgress = mongoose.model('Users', UserSchema);

module.exports = UserProgress;

