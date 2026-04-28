// models/TopUp.js
const mongoose = require('mongoose');

const topupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
    balanceType: {
    type: String,
    enum: ['BTT', 'RP','USDT'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED'],
    default: 'PENDING'
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000 // 5 mins
  }
}, { timestamps: true });

module.exports = mongoose.model('TopUp', topupSchema);