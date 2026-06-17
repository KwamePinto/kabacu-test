const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const getUser = require('../../controllers/webviewControllers/userController');

// ── Rate limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  message: 'Too many accounts created from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  message: 'Too many password reset attempts. Please wait 15 minutes and try again.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: 'Too many OTP attempts. Please wait 15 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3,
  message: 'Too many resend requests. Please wait 15 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth routes ───────────────────────────────────────────────────────────────

router.get('/login', getUser.login);
router.post('/login', loginLimiter, getUser.loginPost);

router.get('/signup', getUser.signup);
router.post('/signup', signupLimiter, getUser.signupPost);

router.get('/logout', getUser.logout);

router.get('/reset-password', getUser.resetPassword);
router.post('/reset-password', passwordLimiter, getUser.resetPasswordPost);

router.get('/verify-otp', getUser.verifyOTP);
router.post('/verify-otp', otpLimiter, getUser.verifyOTPPost);
router.post('/resend-otp', resendLimiter, getUser.resendOTP);

// ── Forgot password flow ──────────────────────────────────────────────────────

router.get('/forgot-password', getUser.forgotPassword);
router.post('/forgot-password', passwordLimiter, getUser.forgotPasswordPost);

router.get('/forgot-password-otp', getUser.forgotPasswordOTP);
router.post('/forgot-password-otp', otpLimiter, getUser.forgotPasswordOTPPost);

router.get('/forgot-password-reset', getUser.forgotPasswordReset);
router.post('/forgot-password-reset', passwordLimiter, getUser.forgotPasswordResetPost);

module.exports = router;