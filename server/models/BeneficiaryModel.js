const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  network: {
    type: String,
    trim: true
  },
  nickname: {
    type: String,
    trim: true
  },
  is_deleted: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
