const express = require('express')
const router = express.Router()

const { authenticateUser } = require('../../config/authMiddleware');
const getPackages = require('../../controllers/webviewControllers/packagesController')

router.get('/',getPackages.packagesView)

router.post('/checkout/initiate',authenticateUser,getPackages.initiateCheckout)

router.get('/checkout',authenticateUser,getPackages.checkoutPage)

router.get('/data-form',authenticateUser,getPackages.dataForm)

// router.get('/payment/paystack',authenticateUser,getPackages.paystack)

router.get('/payment/wallet',authenticateUser,getPackages.wallet)

router.get('/wallet/checkout', authenticateUser, getPackages.walletCheckout);

router.get('/history', authenticateUser, getPackages.history);

router.post('/retry-transaction', authenticateUser, getPackages.retryTransaction);

router.post('/cart/add', authenticateUser, getPackages.addToCart);

router.get('/item-checkout', authenticateUser, getPackages.itemCheckout);

router.get('/my-wallet', authenticateUser, getPackages.userWallet);

// routes
// router.get('/wallet/checkout', authenticateUser, walletController.walletCheckoutPage);
router.post('/wallet/start-topup', authenticateUser, getPackages.startTopUp);
router.post('/wallet/confirm-topup', authenticateUser, getPackages.confirmTopUp);

router.post('/wallet/pay', authenticateUser, getPackages.payWithWallet);

router.get('/user-profile', authenticateUser, getPackages.userProfile);

router.post('/edit-user-profile', authenticateUser, getPackages.editUserProfile);

router.post('/wallet/convert-usdt', authenticateUser, getPackages.convertUSDTtoNaira);

router.post('/update-checkout/:id', authenticateUser, getPackages.editItem);

router.get('/delete-checkout/:id', authenticateUser, getPackages.deleteItem);

router.post('/wallet/preview-conversion', authenticateUser, getPackages.previewUSDTConversion);

router.post( '/palmpay/create', authenticateUser, getPackages.createPalmPayPayment);

router.post( '/palmpay/webhook', getPackages.palmPayWebhook);

router.post( '/wallet/claim-rp', getPackages.claimRP);


module.exports = router;
