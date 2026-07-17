const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/adminControllers/settingsController');

router.get('/',  settingsController.viewSettings);
router.post('/', settingsController.updateSettings);

module.exports = router;
