const adminLayout = 'layouts/adminLayout';
const SiteSettings = require('../../models/SiteSettingsModel');
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
    const rpTransferEnabled = req.body.rpTransferEnabled === 'true';
    const rpTransferSuspendedMessage = (req.body.rpTransferSuspendedMessage || '').trim();

    const settings = await SiteSettings.getSettings();
    settings.rpTransferEnabled = rpTransferEnabled;
    if (rpTransferSuspendedMessage) {
      settings.rpTransferSuspendedMessage = rpTransferSuspendedMessage;
    }
    await settings.save();

    res.redirect('/admin/settings?saved=1');
  } catch (err) {
    console.error('[settingsController.updateSettings]', err);
    res.redirect('/admin/settings?error=1');
  }
}];
