const express = require('express')
const router = express.Router()


const getUser = require('../../controllers/webviewControllers/userController')

router.get('/login',getUser.login)

router.post('/login',getUser.loginPost)

router.get('/signup',getUser.signup)

router.post('/signup',getUser.signupPost)

router.get('/logout',getUser.logout)

router.get('/reset-password',getUser.resetPassword)
router.post('/reset-password',getUser.resetPasswordPost)

router.get('/verify-otp', getUser.verifyOTP)
router.post('/verify-otp', getUser.verifyOTPPost)
router.post('/resend-otp', getUser.resendOTP)

module.exports = router;
