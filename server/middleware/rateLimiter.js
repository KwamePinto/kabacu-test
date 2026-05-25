const rateLimit = require('express-rate-limit');


// =========================================
// LOGIN LIMITER
// =========================================

exports.loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    message: {
        success: false,
        message:
            'Too many login attempts. Try again later.'
    },

    standardHeaders: true,

    legacyHeaders: false
});


// =========================================
// SIGNUP LIMITER
// =========================================

exports.signupLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    message: {
        success: false,
        message:
            'Too many signup attempts. Try again later.'
    },

    standardHeaders: true,

    legacyHeaders: false
});