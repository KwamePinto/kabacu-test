const mongoose = require('mongoose');

const NetworkSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true, trim: true },
  apiCode:    { type: Number, required: true, enum: [1, 2, 3, 4] },
  is_deleted: { type: Number, default: 0 },
}, { timestamps: true });

// Human-readable label for each API code
NetworkSchema.statics.providerLabel = function (code) {
  return { 1: 'MTN', 2: 'GLO', 3: 'Airtel', 4: '9mobile' }[code] || 'Unknown';
};

module.exports = mongoose.model('Network', NetworkSchema);
