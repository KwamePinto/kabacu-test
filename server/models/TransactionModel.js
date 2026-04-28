const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
 
  phone: String,
  amount: Number,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'failed'
  },
  reference: String,
  //apiResponse: Object
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);