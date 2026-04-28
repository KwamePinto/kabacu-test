const express = require('express')
const router = express.Router()

const { authenticateUser } = require('../../config/authMiddleware');
const getPackages = require('../../controllers/webviewControllers/packagesController')

router.get('/',getPackages.packagesView)

router.post('/checkout/initiate',authenticateUser,getPackages.initiateCheckout)

router.get('/checkout',authenticateUser,getPackages.checkoutPage)

router.get('/payment/paystack',authenticateUser,getPackages.paystack)

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


module.exports = router;
