const bcrypt       = require('bcrypt');
const saltRounds   = 10;
const UserAdminModel = require('../../models/UserAdminModel');
const Transaction  = require('../../models/TransactionModel');
const TopUp        = require('../../models/TopUpModal');
const User         = require('../../models/UserModel');
const sendEmail    = require('../../utils/emailService');
const adminLayouts = 'layouts/adminLayout';
const { generateUserAdminToken } = require('../../config/authUtils');
const { authenticateAdminUser }  = require('../../config/authMiddleware');

/* ── helpers ────────────────────────────────────────────── */
function generateAdminPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = 'CTC';
  for (let i = 0; i < 7; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

function adminCredentialsEmail({ username, email, password, role, loginUrl }) {
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#47c363;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Kabacu Admin Portal</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">Welcome aboard, ${username}!</h2>
            <p style="margin:0 0 12px;color:#374151;line-height:1.7;font-size:14px;">
              You have been added as an administrator on the <strong>Kabacu</strong> platform. Your account is now active.
              Below are your login credentials — please keep them safe and confidential.
            </p>
            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Email</span><br>
                  <strong style="color:#111827;font-size:14px;">${email}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e5e7eb;">
                  <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Temporary Password</span><br>
                  <strong style="color:#111827;font-size:15px;font-family:monospace;letter-spacing:.1em;">${password}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;">
                  <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Role</span><br>
                  <strong style="color:#111827;font-size:14px;">${roleLabel}</strong>
                </td>
              </tr>
            </table>
            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" style="display:inline-block;background:#47c363;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:6px;text-decoration:none;letter-spacing:.01em;">
                    Log In to Dashboard
                  </a>
                </td>
              </tr>
            </table>
            <!-- Security notice -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;margin:0 0 20px;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                    <strong>Security notice:</strong> You will be prompted to complete your profile on first login. Please update your password immediately.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              If you did not expect this email, please contact your system administrator immediately at
              <a href="mailto:support@kabacu.com" style="color:#47c363;">support@kabacu.com</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} Kabacu. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Login ──────────────────────────────────────────────── */
exports.loginAdmin = (req, res) => {
  try {
    res.render('adminview/users/auth-login', { layout: adminLayouts });
  } catch (error) {
    console.log(error);
  }
};

exports.loginAdminPost = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await UserAdminModel.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role !== role) return res.status(401).json({ error: 'Incorrect role selected' });

    const token = generateUserAdminToken(user);
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.session.info = { role: user.role };

    // Redirect to profile completion on first login
    if (!user.profileCompleted) {
      return res.redirect('/admin/user/profile?firstLogin=1');
    }

    res.redirect('/admin/main/dashboard');
  } catch (error) {
    console.log('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/* ── Logout ─────────────────────────────────────────────── */
exports.logout = (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/user/login');
};

/* ── Admin management ───────────────────────────────────── */
exports.viewAdmins = [authenticateAdminUser, async (req, res) => {
  try {
    const admins = await UserAdminModel.find().populate('addedBy', 'username email').sort({ createdAt: -1 });
    res.render('adminview/users/view-admins', { admins, query: req.query, layout: adminLayouts });
  } catch (error) {
    console.log('VIEW ADMINS ERROR:', error);
    res.redirect('/admin/main/dashboard');
  }
}];

exports.addAdminForm = [authenticateAdminUser, (req, res) => {
  res.render('adminview/users/add-admin', { layout: adminLayouts });
}];

exports.addAdminPost = [authenticateAdminUser, async (req, res) => {
  try {
    const { username, email, role } = req.body;

    const existing = await UserAdminModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'An admin with this email already exists.' });
    }

    const plainPassword  = generateAdminPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    await UserAdminModel.create({
      username:         username.trim(),
      email:            email.toLowerCase().trim(),
      password:         hashedPassword,
      role,
      profileCompleted: false,
      addedBy:          req.user.id,
    });

    const loginUrl = `${req.protocol}://${req.get('host')}/admin/user/login`;

    await sendEmail({
      to:      email.toLowerCase().trim(),
      subject: 'Your Kabacu Admin Account Details',
      html:    adminCredentialsEmail({ username, email, password: plainPassword, role, loginUrl }),
      text:    `Welcome ${username}. Email: ${email} | Password: ${plainPassword} | Role: ${role}. Login at ${loginUrl}`,
    });

    res.redirect('/admin/user/admins?success=1');
  } catch (error) {
    console.log('ADD ADMIN ERROR:', error);
    res.status(500).json({ error: error.message });
  }
}];

/* ── Profile ────────────────────────────────────────────── */
exports.adminProfile = [authenticateAdminUser, async (req, res) => {
  try {
    const admin = await UserAdminModel.findById(req.user.id);
    const firstLogin = req.query.firstLogin === '1';
    res.render('adminview/profile', { admin, firstLogin, query: req.query, layout: adminLayouts });
  } catch (error) {
    console.log('PROFILE ERROR:', error);
    res.redirect('/admin/main/dashboard');
  }
}];

exports.adminProfilePost = [authenticateAdminUser, async (req, res) => {
  try {
    const { phone, bio, department } = req.body;
    await UserAdminModel.findByIdAndUpdate(req.user.id, {
      phone:            phone || '',
      bio:              bio   || '',
      department:       department || '',
      profileCompleted: true,
    });
    res.redirect('/admin/user/profile?saved=1');
  } catch (error) {
    console.log('PROFILE SAVE ERROR:', error);
    res.redirect('/admin/user/profile?error=1');
  }
}];

/* ── Notifications (JSON) ───────────────────────────────── */
exports.getNotifications = [authenticateAdminUser, async (req, res) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newUsers, pendingTopUps, recentFailedTx, recentPurchases] = await Promise.all([
      User.find({ createdAt: { $gte: since24h } }).select('username email createdAt').sort({ createdAt: -1 }).limit(5),
      TopUp.countDocuments({ status: 'PENDING' }),
      Transaction.find({ status: 'failed', createdAt: { $gte: since24h } }).select('amount reference createdAt').sort({ createdAt: -1 }).limit(3),
      Transaction.find({ status: 'success', createdAt: { $gte: since24h } }).select('amount createdAt').sort({ createdAt: -1 }).limit(5),
    ]);

    const notifications = [];

    newUsers.forEach(u => {
      notifications.push({
        icon: 'user-plus',
        color: 'bg-success',
        text: `New user registered: <b>${u.username}</b>`,
        time: u.createdAt,
      });
    });

    if (pendingTopUps > 0) {
      notifications.push({
        icon: 'clock',
        color: 'bg-warning',
        text: `<b>${pendingTopUps}</b> wallet top-up${pendingTopUps > 1 ? 's' : ''} pending`,
        time: new Date(),
      });
    }

    recentFailedTx.forEach(tx => {
      notifications.push({
        icon: 'alert-triangle',
        color: 'bg-danger',
        text: `Transaction failed — ₦${(tx.amount || 0).toLocaleString()} (ref: ${tx.reference || '—'})`,
        time: tx.createdAt,
      });
    });

    recentPurchases.forEach(tx => {
      notifications.push({
        icon: 'shopping-cart',
        color: 'bg-primary',
        text: `New purchase — ₦${(tx.amount || 0).toLocaleString()}`,
        time: tx.createdAt,
      });
    });

    // Sort by time descending, cap at 10
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ success: true, notifications: notifications.slice(0, 10) });
  } catch (error) {
    console.log('NOTIFICATIONS ERROR:', error);
    res.json({ success: false, notifications: [] });
  }
}];
