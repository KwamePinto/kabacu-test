const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/damageControlController');

router.get('/',       ctrl.viewDamageControl);
router.post('/deduct', ctrl.deductWallet);

module.exports = router;
