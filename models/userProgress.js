const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  telegramId:
   { type: Number,
     required: true,
     index: true,
      unique: true 
   },

  nickname:
  { 
    type: String,
     required: true
  },

  firstName: 
  { 
    type: String,
     required: true 
  },

  hasNicknameBonus: 
  {
    type: Boolean, 
    default: false
  },

  coins:
  { 
    type: Number, 
    default: 0 
  },
  coinsSub:
  { 
    type: Number, 
    default: 0 
  },

  walletAddress: { 
    type: String, 
    required: false 
  },
  
  hasTelegramPremium:
  { 
    type: Boolean,
     default: false
  },

  hasCheckedSubscription: 
  { type: Boolean,
     default: false
  },

  hasCheckedSubscription2:
  { type: Boolean,
     default: false
  },

  hasCheckedSubscription3:
  { type: Boolean,
     default: false
  },

  hasCheckedSubscription4:
  { type: Boolean,
     default: false
  },

  hasReceivedTwitterReward:
  {
     type: Boolean, 
     default: false
    
  },

  hasBotSub:
  {
     type: Boolean, 
     default: false
    
  },

  hasMintedNFT: {
    type: Boolean,
    default: false
  },

  transactionNumber: { 
    type: Number, 
    default: 0 
  },

  referralCode:
  { 
    type: String,
     unique: true
  }, // Код реферала

  specialTransactionCounter:
  { 
    type: Number,
     default: 0 
  }, // Новый счетчик, который вы хотите добавить


  referredUsers:
  [{ 
    nickname: String,
    earnedCoins: Number
  }]
});

const UserProgress = mongoose.model('UsersUspech', UserSchema);
module.exports = UserProgress;

