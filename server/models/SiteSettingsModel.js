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

  // Maintenance mode
  maintenanceModeEnabled: {
    type: Boolean,
    default: true,
  },
  maintenanceMessage: {
    type: String,
    default: "We're currently performing scheduled maintenance to improve your experience. We'll be back up shortly — thank you for your patience.",
  },

  // Upcoming maintenance banner
  maintenanceBannerEnabled: {
    type: Boolean,
    default: false,
  },
  maintenanceBannerScheduledAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Singleton helper — always work with the one document
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
