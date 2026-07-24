const UserDevice          = require('../../models/UserDeviceModel');
const NotificationMessage = require('../../models/NotificationMessageModel');
const User                = require('../../models/UserModel');
const { sendToPlayers, sendToAll } = require('../../services/oneSignalService');
const logger = require('../../config/logger');

async function viewPanel(req, res) {
  try {
    const [messages, devices] = await Promise.all([
      NotificationMessage.find().sort({ createdAt: -1 }),
      UserDevice.find().populate('user', 'firstname lastname email'),
    ]);

    // Group devices by user
    const userMap = {};
    for (const d of devices) {
      if (!d.user) continue;
      const uid = d.user._id.toString();
      if (!userMap[uid]) {
        userMap[uid] = { user: d.user, devices: [] };
      }
      userMap[uid].devices.push(d);
    }
    const registeredUsers = Object.values(userMap);

    res.render('adminview/notifications', {
      title: 'Notifications',
      messages,
      registeredUsers,
      tab: req.query.tab || 'messages',
    });
  } catch (err) {
    logger.error('notificationsController.viewPanel: %s', err.message);
    res.render('adminview/notifications', {
      title: 'Notifications',
      messages: [],
      registeredUsers: [],
      tab: 'messages',
      error: err.message,
    });
  }
}

async function addMessage(req, res) {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      req.flash('error', 'Title and body are required');
      return res.redirect('/admin/push-notifications?tab=messages');
    }
    await NotificationMessage.create({ title, body });
    req.flash('success', 'Message saved');
    return res.redirect('/admin/push-notifications?tab=messages');
  } catch (err) {
    logger.error('notificationsController.addMessage: %s', err.message);
    req.flash('error', 'Failed to save message');
    return res.redirect('/admin/push-notifications?tab=messages');
  }
}

async function deleteMessage(req, res) {
  try {
    await NotificationMessage.findByIdAndDelete(req.params.id);
    req.flash('success', 'Message deleted');
  } catch (err) {
    req.flash('error', 'Failed to delete message');
  }
  return res.redirect('/admin/push-notifications?tab=messages');
}

async function sendToUser(req, res) {
  try {
    const { userId, messageId, customTitle, customBody } = req.body;

    let title, body;
    if (messageId && messageId !== 'custom') {
      const msg = await NotificationMessage.findById(messageId);
      if (!msg) {
        req.flash('error', 'Message not found');
        return res.redirect('/admin/push-notifications?tab=send');
      }
      title = msg.title;
      body  = msg.body;
    } else {
      title = customTitle;
      body  = customBody;
    }

    if (!title || !body) {
      req.flash('error', 'Title and body are required');
      return res.redirect('/admin/push-notifications?tab=send');
    }

    const devices = await UserDevice.find({ user: userId });
    if (!devices.length) {
      req.flash('error', 'No registered devices for this user');
      return res.redirect('/admin/push-notifications?tab=send');
    }

    await sendToPlayers(devices.map(d => d.fcmToken), title, body);
    req.flash('success', 'Notification sent');
    return res.redirect('/admin/push-notifications?tab=send');
  } catch (err) {
    logger.error('notificationsController.sendToUser: %s', err.message);
    req.flash('error', 'Failed to send notification: ' + err.message);
    return res.redirect('/admin/push-notifications?tab=send');
  }
}

async function broadcast(req, res) {
  try {
    const { messageId, customTitle, customBody, userIds } = req.body;

    let title, body;
    if (messageId && messageId !== 'custom') {
      const msg = await NotificationMessage.findById(messageId);
      if (!msg) {
        req.flash('error', 'Message not found');
        return res.redirect('/admin/push-notifications?tab=send');
      }
      title = msg.title;
      body  = msg.body;
    } else {
      title = customTitle;
      body  = customBody;
    }

    if (!title || !body) {
      req.flash('error', 'Title and body are required');
      return res.redirect('/admin/push-notifications?tab=send');
    }

    // If specific users selected, send to their devices only
    if (userIds && userIds.length) {
      const ids  = Array.isArray(userIds) ? userIds : [userIds];
      const devs = await UserDevice.find({ user: { $in: ids } });
      if (!devs.length) {
        req.flash('error', 'No registered devices for the selected users');
        return res.redirect('/admin/push-notifications?tab=send');
      }
      await sendToPlayers(devs.map(d => d.fcmToken), title, body);
    } else {
      // Broadcast to all registered devices
      await sendToAll(title, body);
    }

    req.flash('success', 'Broadcast sent');
    return res.redirect('/admin/push-notifications?tab=send');
  } catch (err) {
    logger.error('notificationsController.broadcast: %s', err.message);
    req.flash('error', 'Failed to broadcast: ' + err.message);
    return res.redirect('/admin/push-notifications?tab=send');
  }
}

module.exports = { viewPanel, addMessage, deleteMessage, sendToUser, broadcast };
