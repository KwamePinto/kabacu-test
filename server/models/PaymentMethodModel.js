const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);