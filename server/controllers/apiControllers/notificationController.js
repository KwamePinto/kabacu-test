const UserDevice = require('../../models/UserDeviceModel');
const logger     = require('../../config/logger');

async function registerDevice(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken || xToken !== process.env.NOTIFICATION_X_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { user_ID, device_ID, fcm_token } = req.body;
  if (!user_ID || !device_ID || !fcm_token) {
    return res.status(400).json({ success: false, message: 'user_ID, device_ID and fcm_token are required' });
  }

  try {
    await UserDevice.findOneAndUpdate(
      { deviceId: device_ID },
      { user: user_ID, deviceId: device_ID, fcmToken: fcm_token },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: 'Device registered' });
  } catch (err) {
    logger.error('registerDevice error: %s', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { registerDevice };
