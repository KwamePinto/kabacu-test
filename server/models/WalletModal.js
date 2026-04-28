const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   balances: {
    BTT: {
      type: Number,
      default: 0
    },
    RP: {
      type: Number,
      default: 0
    },
     USDT: {
      type: Number,
      default: 0
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);