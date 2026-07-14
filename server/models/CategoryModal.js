const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true
  },
  is_deleted: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

module.exports = mongoose.model('category', categorySchema);
