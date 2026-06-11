const { verifyUserToken } = require('../config/authUtils');

function apiAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: no token provided' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyUserToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      minerId: decoded.minerId
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired token' });
  }
}

module.exports = apiAuth;
