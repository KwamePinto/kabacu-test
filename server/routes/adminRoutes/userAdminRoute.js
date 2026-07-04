const express = require('express');
const router  = express.Router();
const getAdminUsers = require('../../controllers/adminControllers/userAdminController');

// ── Auth ───────────────────────────────────────────────────
router.get('/login',  getAdminUsers.loginAdmin);
router.post('/login', getAdminUsers.loginAdminPost);
router.get('/logout', getAdminUsers.logout);

// ── Profile ────────────────────────────────────────────────
router.get('/profile',  getAdminUsers.adminProfile);
router.post('/profile', getAdminUsers.adminProfilePost);

// ── Admin management (super_admin only) ───────────────────
router.get('/admins',              getAdminUsers.viewAdmins);
router.get('/admins/add',          getAdminUsers.addAdminForm);
router.post('/admins/add',         getAdminUsers.addAdminPost);
router.post('/admins/toggle-status', getAdminUsers.toggleAdminStatus);

// ── Notifications JSON ─────────────────────────────────────
router.get('/notifications', getAdminUsers.getNotifications);

module.exports = router;
