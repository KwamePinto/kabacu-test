const { authenticateAdminUser } = require('../../config/authMiddleware');
const Transaction = require('../../models/TransactionModel');
const Wallet      = require('../../models/WalletModal');

// Transactions that look like timeout failures:
// - wallet payment, failed status
// - apiResponse is bare { status: 'fail' } with no message (set by our catch block, not OurDataStore)
// - not already manually deducted
const SUSPICIOUS_FILTER = {
  paymentMethod: 'wallet',
  status: 'failed',
  'apiResponse.status': 'fail',
  'apiResponse.message': { $exists: false },
  'apiResponse.adminDeducted': { $ne: true },
};

exports.viewDamageControl = [authenticateAdminUser, async (req, res) => {
  try {
    const suspicious = await Transaction.find(SUSPICIOUS_FILTER)
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    // For each suspicious tx, check if the user has a SUCCESSFUL wallet tx for the same
    // phone + amount within 24 hours after — meaning they retried and paid on that retry.
    const rows = await Promise.all(suspicious.map(async tx => {
      const windowEnd = new Date(tx.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const successRetry = await Transaction.findOne({
        user:   tx.user,
        phone:  tx.phone,
        amount: tx.amount,
        status: 'success',
        createdAt: { $gt: tx.createdAt, $lt: windowEnd },
      }).lean();

      return { ...tx.toObject(), hasSuccessRetry: !!successRetry };
    }));

    const totalAmount = rows.reduce((s, r) => s + (r.amount || 0), 0);
    const alreadyDeducted = await Transaction.countDocuments({
      paymentMethod: 'wallet',
      status: 'failed',
      'apiResponse.adminDeducted': true,
    });

    res.render('adminview/damage-control', {
      layout: 'layouts/adminLayout',
      rows,
      totalAmount,
      alreadyDeducted,
    });
  } catch (err) {
    console.error('[damageControl]', err);
    res.render('adminview/damage-control', {
      layout: 'layouts/adminLayout',
      rows: [],
      totalAmount: 0,
      alreadyDeducted: 0,
      error: 'Failed to load data',
    });
  }
}];

exports.deductWallet = [authenticateAdminUser, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.json({ success: false, message: 'Transaction not found' });
    }
    if (tx.status !== 'failed') {
      return res.json({ success: false, message: 'Only failed transactions can be manually deducted' });
    }
    if (tx.apiResponse?.adminDeducted) {
      return res.json({ success: false, message: 'Already deducted' });
    }

    const wallet = await Wallet.findOne({ user: tx.user });
    if (!wallet) {
      return res.json({ success: false, message: 'User wallet not found' });
    }

    const before = wallet.balances.NAIRA;
    if (before < tx.amount) {
      return res.json({
        success: false,
        message: `Insufficient balance — user has ₦${before.toLocaleString()}, transaction was ₦${tx.amount.toLocaleString()}`,
      });
    }

    wallet.balances.NAIRA -= tx.amount;
    await wallet.save();

    tx.apiResponse = {
      status: 'fail',
      adminDeducted: true,
      adminDeductedAt: new Date().toISOString(),
      balanceBefore: before,
      balanceAfter: wallet.balances.NAIRA,
    };
    tx.markModified('apiResponse');
    await tx.save();

    return res.json({
      success: true,
      message: `Deducted ₦${tx.amount.toLocaleString()}. Balance: ₦${before.toLocaleString()} → ₦${wallet.balances.NAIRA.toLocaleString()}`,
    });
  } catch (err) {
    console.error('[damageControl deduct]', err);
    return res.json({ success: false, message: 'Server error' });
  }
}];
