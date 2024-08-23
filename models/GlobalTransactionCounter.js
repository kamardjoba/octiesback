// models/GlobalTransactionCounter.js
const mongoose = require('mongoose');

const GlobalTransactionCounterSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
});

const GlobalTransactionCounter = mongoose.model('GlobalTransactionCounter', GlobalTransactionCounterSchema);

module.exports = GlobalTransactionCounter;
