const mongoose = require('mongoose');

const NotificationMessageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body:  { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('NotificationMessage', NotificationMessageSchema);
