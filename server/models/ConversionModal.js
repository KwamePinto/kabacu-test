const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  usdtAmount: {
    type: Number,
    required: true
  },
  nairaAmount: {
    type: Number,
    required: true
  },
  finalRate: {
    type: Number,
    required: true
  },
  bestRate: {
    type: Number
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversion', conversionSchema);