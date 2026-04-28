const { verifyUserAdminToken } = require('./authUtils');

function loadAdmin(req, res, next) {
    const token = req.cookies.admin_token;

    if (!token) {
        req.admin = null;
        res.locals.admin = null;
        return next();
    }

    try {
        const decoded = verifyUserAdminToken(token);

        req.admin = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };

        // ✅ Make available in ALL views
        res.locals.admin = req.admin;

    } catch (err) {
        console.log("Invalid admin token:", err.message);
        res.clearCookie('admin_token');
        req.admin = null;
        res.locals.admin = null;
    }

    next();
}

module.exports = loadAdmin;