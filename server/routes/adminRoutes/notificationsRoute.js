const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/notificationsController');

router.get('/',                ctrl.viewPanel);
router.post('/messages',       ctrl.addMessage);
router.delete('/messages/:id', ctrl.deleteMessage);
router.post('/send',           ctrl.sendToUser);
router.post('/broadcast',      ctrl.broadcast);

module.exports = router;
