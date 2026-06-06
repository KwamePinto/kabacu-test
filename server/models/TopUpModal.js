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
  reference:{
    type:String
  },
  paymentMethod:{
    type: String
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000 // 5 mins
  }
}, { timestamps: true });

const TopUp = mongoose.model('TopUp', topupSchema);
module.exports = TopUp;

