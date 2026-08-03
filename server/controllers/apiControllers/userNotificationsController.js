const UserNotification = require('../../models/UserNotificationModel');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await UserNotification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.json({ success: false, notifications: [], unreadCount: 0 });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await UserNotification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
};
