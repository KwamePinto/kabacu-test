const User        = require('../../models/UserModel');
const Transaction = require('../../models/TransactionModel');
const TopUp       = require('../../models/TopUpModal');
const Wallet      = require('../../models/WalletModal');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, wallet, recentOrders, recentTopups] = await Promise.all([
      User.findById(userId).select('-password -verificationToken -verificationTokenExpires'),
      Wallet.findOne({ user: userId }),
      Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(5).populate('product products.product'),
      TopUp.find({ user: userId, status: 'COMPLETED' }).sort({ createdAt: -1 }).limit(5)
    ]);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      user,
      wallet:       wallet ? wallet.balances : { BTT: 0, RP: 0, USDT: 0, NAIRA: 0 },
      recentOrders,
      recentTopups
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { username, email, minerId } = req.body;

    username = username?.trim();
    email    = email?.trim().toLowerCase();
    minerId  = minerId?.trim();

    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'username and email are required' });
    }

    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already in use' });

    const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUsername) return res.status(409).json({ success: false, message: 'Username already taken' });

    const user = await User.findByIdAndUpdate(
      userId,
      { username, email, minerId },
      { new: true }
    ).select('-password -verificationToken -verificationTokenExpires');

    res.json({ success: true, message: 'Profile updated', user });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
