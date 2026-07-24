const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/ourdatastoreController');

router.get('/', ctrl.viewDashboard);

module.exports = router;
