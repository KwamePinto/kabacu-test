const { verifyUserToken, verifyUserAdminToken } = require('./authUtils');
const UserAdminModel = require('../models/UserAdminModel');

function authenticateUser(req, res, next) {
  const token = req.cookies.user_token;

  if (!token) {
    console.log("You must be logged in.");
    return res.redirect('/user/login'); // ✅ NOT "/"
  }

  try {
    const decoded = verifyUserToken(token);

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role:  decoded.role,
      minerId: decoded.minerId
    };

    res.locals.user = req.user;

    next();

  } catch (error) {
    console.log("Invalid token:", error.message);
    res.clearCookie('user_token');
    return res.redirect('/user/login'); // ✅ NOT "/"
  }
}

function authenticateAdminUser(req, res, next) {
  const token = req.cookies.admin_token;

  if (!token) {
    console.log("You must be logged in.");
    return res.redirect('/admin/user/login');
  }

  try {
    const decoded = verifyUserAdminToken(token);

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role:  decoded.role,
    };

    res.locals.user = req.user;

    // Async check: if account has been deactivated since token was issued, kick them out
    UserAdminModel.findById(decoded.userId).select('isActive').lean()
      .then(function (admin) {
        if (!admin || admin.isActive === false) {
          res.clearCookie('admin_token');
          return res.redirect('/admin/user/login');
        }
        next();
      })
      .catch(function () { next(); }); // on DB error, allow through to avoid locking everyone out

  } catch (error) {
    console.log("Invalid token:", error.message);
    res.clearCookie('admin_token');
    return res.redirect('/admin/user/login');
  }
}


function optionalUser(req, res, next) {
  const token = req.cookies.user_token;

  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = verifyUserToken(token);

    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };

    res.locals.user = req.user;

  } catch (error) {
    res.locals.user = null;
    res.clearCookie('user_token');
  }

  next();
}



module.exports = {
  authenticateAdminUser,
  authenticateUser,
  optionalUser
};
