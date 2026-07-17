const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  rpTransferEnabled: {
    type: Boolean,
    default: false,
  },
  rpTransferSuspendedMessage: {
    type: String,
    default: 'RP transfer to BitToken has been suspended for the time being. Please check back later.',
  },
}, { timestamps: true });

// Singleton helper — always work with the one document
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
