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


// exports.sendOTP = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.SMTP_FROM || '"Data Mall" <no-reply@datamall.com>',
//     to: email,
//     subject: 'Verify Your Email - OTP Verification Code',
//     text: `Your OTP verification code is ${otp}. It will expire in 15 minutes.`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//         <h2 style="color: #333; text-align: center;">Email Verification</h2>
//         <p>Thank you for registering. Please verify your email address by entering the following One-Time Password (OTP) code:</p>
//         <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; color: #4A90E2; letter-spacing: 2px;">
//           ${otp}
//         </div>
//         <p>This OTP will expire in 15 minutes.</p>
//         <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
//       </div>
//     `,
//   };