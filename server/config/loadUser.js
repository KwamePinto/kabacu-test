const { verifyUserToken } = require('./authUtils');

function loadUser(req, res, next) {
    const token = req.cookies.user_token; // ✅ ONLY user token

    if (!token) {
        req.user = null;
        res.locals.user = null;
        return next();
    }

    try {
        const decoded = verifyUserToken(token);

        req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        res.locals.user = req.user;

    } catch (err) {
        res.clearCookie('user_token');
        req.user = null;
        res.locals.user = null;
    }

    next();
}

module.exports = loadUser;