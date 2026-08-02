const { authenticateAdminUser } = require('../../config/authMiddleware');
const Transaction = require('../../models/TransactionModel');
const Wallet      = require('../../models/WalletModal');

// Case 1 (pre-fix): timed out → treated as fail → wallet refunded → may need manual deduction
const OLD_FLAGGED_FILTER = {
  paymentMethod: 'wallet',
  status: 'failed',
  'apiResponse.status': 'fail',
  'apiResponse.message': { $exists: false },
  'apiResponse.adminDeducted': { $ne: true },
};

// Case 2 (post-fix): timed out → saved as pending → wallet is already deducted → needs verification
const NEW_FLAGGED_FILTER = {
  paymentMethod: 'wallet',
  status: 'pending',
  'apiResponse._timedOut': true,
};

exports.viewDamageControl = [authenticateAdminUser, async (req, res) => {
  try {
    const [oldFlagged, newFlagged] = await Promise.all([
      Transaction.find(OLD_FLAGGED_FILTER).populate('user', 'username email').sort({ createdAt: -1 }),
      Transaction.find(NEW_FLAGGED_FILTER).populate('user', 'username email').sort({ createdAt: -1 }),
    ]);

    // Merge and sort by date descending
    const allFlagged = [...oldFlagged, ...newFlagged]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // For each, check if a successful retry exists within 24 h
    const rows = await Promise.all(allFlagged.map(async tx => {
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

    const deductedHistory = await Transaction.find({
      paymentMethod: 'wallet',
      'apiResponse.adminDeducted': true,
    }).populate('user', 'username email').sort({ 'apiResponse.adminDeductedAt': -1 }).lean();

    const alreadyDeducted = deductedHistory.length;

    res.render('adminview/flagged-transactions', {
      layout: 'layouts/adminLayout',
      rows,
      totalAmount,
      alreadyDeducted,
      deductedHistory,
    });
  } catch (err) {
    console.error('[damageControl]', err);
    res.render('adminview/flagged-transactions', {
      layout: 'layouts/adminLayout',
      rows: [],
      totalAmount: 0,
      alreadyDeducted: 0,
      deductedHistory: [],
      error: 'Failed to load data',
    });
  }
}];

// POST /deduct
// Case 1 (old): status=failed, wallet was refunded — deduct it now if data was delivered.
exports.deductWallet = [authenticateAdminUser, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx)                        return res.json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'failed')     return res.json({ success: false, message: 'Only failed transactions can be manually deducted' });
    if (tx.apiResponse?.adminDeducted) return res.json({ success: false, message: 'Already deducted' });

    const wallet = await Wallet.findOne({ user: tx.user });
    if (!wallet) return res.json({ success: false, message: 'User wallet not found' });

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
    console.error('[flagged deduct]', err);
    return res.json({ success: false, message: 'Server error' });
  }
}];

// POST /resolve
// Case 2 (new): status=pending, wallet is already deducted.
//   action=delivered → mark success (data arrived, charge is correct — no wallet change)
//   action=refund    → credit wallet back and mark refunded (data never arrived)
exports.resolveTransaction = [authenticateAdminUser, async (req, res) => {
  try {
    const { transactionId, action } = req.body;
    if (!['delivered', 'refund'].includes(action)) {
      return res.json({ success: false, message: 'Invalid action' });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.json({ success: false, message: 'Transaction not found' });
    if (tx.status !== 'pending') return res.json({ success: false, message: 'Transaction is no longer pending' });
    if (!tx.apiResponse?._timedOut) return res.json({ success: false, message: 'Not a timeout transaction' });

    if (action === 'delivered') {
      tx.status = 'success';
      tx.apiResponse = { status: 'success', _resolvedByAdmin: true, resolvedAt: new Date().toISOString() };
      tx.markModified('apiResponse');
      await tx.save();
      return res.json({ success: true, message: 'Transaction marked as delivered. Wallet charge stands.' });
    }

    // action === 'refund'
    const wallet = await Wallet.findOne({ user: tx.user });
    if (!wallet) return res.json({ success: false, message: 'User wallet not found' });

    const before = wallet.balances.NAIRA;
    wallet.balances.NAIRA += tx.amount;
    await wallet.save();

    tx.status = 'refunded';
    tx.apiResponse = {
      status: 'fail',
      _resolvedByAdmin: true,
      adminRefunded: true,
      resolvedAt: new Date().toISOString(),
      balanceBefore: before,
      balanceAfter: wallet.balances.NAIRA,
    };
    tx.markModified('apiResponse');
    await tx.save();

    return res.json({
      success: true,
      message: `Refunded ₦${tx.amount.toLocaleString()} to user. Balance: ₦${before.toLocaleString()} → ₦${wallet.balances.NAIRA.toLocaleString()}`,
    });
  } catch (err) {
    console.error('[flagged resolve]', err);
    return res.json({ success: false, message: 'Server error' });
  }
}];
