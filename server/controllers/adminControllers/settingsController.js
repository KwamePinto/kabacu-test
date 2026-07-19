const adminLayout = 'layouts/adminLayout';
const SiteSettings = require('../../models/SiteSettingsModel');
const maintenanceMiddleware = require('../../middleware/maintenanceMiddleware');
const { authenticateAdminUser } = require('../../config/authMiddleware');

exports.viewSettings = [authenticateAdminUser, async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.render('adminview/settings', {
      layout: adminLayout,
      settings,
      query: req.query,
    });
  } catch (err) {
    console.error('[settingsController.viewSettings]', err);
    res.status(500).send('Error loading settings.');
  }
}];

exports.updateSettings = [authenticateAdminUser, async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    // ── RP Transfer ────────────────────────────────────────────────────────────
    settings.rpTransferEnabled = req.body.rpTransferEnabled === 'true';
    const rpMsg = (req.body.rpTransferSuspendedMessage || '').trim();
    if (rpMsg) settings.rpTransferSuspendedMessage = rpMsg;

    // ── Maintenance mode ───────────────────────────────────────────────────────
    settings.maintenanceModeEnabled = req.body.maintenanceModeEnabled === 'true';
    const maintMsg = (req.body.maintenanceMessage || '').trim();
    if (maintMsg) settings.maintenanceMessage = maintMsg;

    // ── Upcoming maintenance banner ────────────────────────────────────────────
    settings.maintenanceBannerEnabled = req.body.maintenanceBannerEnabled === 'true';
    const rawDate = (req.body.maintenanceBannerScheduledAt || '').trim();
    settings.maintenanceBannerScheduledAt = rawDate ? new Date(rawDate) : null;

    await settings.save();

    // Flush the 30-second middleware cache so changes take effect immediately
    maintenanceMiddleware.invalidateCache();

    res.redirect('/admin/settings?saved=1');
  } catch (err) {
    console.error('[settingsController.updateSettings]', err);
    res.redirect('/admin/settings?error=1');
  }
}];
