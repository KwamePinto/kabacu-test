const mongoose = require('mongoose');

const coursePurchaseSchema = new mongoose.Schema({
  email: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  courseId: { type: String, required: true },
  courseTitle: { type: String, default: '' },
  price: { type: Number, default: 0 },
  free: { type: Boolean, default: false },
  transactionRef: { type: String },
}, { timestamps: true });

coursePurchaseSchema.index({ email: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CoursePurchase', coursePurchaseSchema);
