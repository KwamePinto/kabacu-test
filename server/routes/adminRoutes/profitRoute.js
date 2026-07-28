const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/profitController');

router.get('/', ctrl.viewReport);

module.exports = router;
