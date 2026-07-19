const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/logsController');

router.get('/',          ctrl.viewLogs);
router.get('/download',  ctrl.downloadLog);

module.exports = router;
