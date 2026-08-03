const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/adminControllers/transactionsAdminController');

router.get('/',                    ctrl.viewTransactions);
router.post('/resolve-attention',  ctrl.resolveAttention);
router.post('/force-refund',       ctrl.forceRefund);
router.post('/clear',              ctrl.clearTransaction);

module.exports = router;
