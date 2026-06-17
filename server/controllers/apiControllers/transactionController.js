const Transaction = require('../../models/TransactionModel');
const Wallet      = require('../../models/WalletModal');
const Product     = require('../../models/ProductsModal');
const User        = require('../../models/UserModel');
const { buyData } = require('../../services/ourdatastore');

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments({ user: req.user.id });

    const transactions = await Transaction.find({ user: req.user.id })
      .populate('product')
      .populate('products.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.retryTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate('product');

    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (tx.status === 'success') return res.json({ success: false, message: 'Already successful' });

    const wallet = await Wallet.findOne({ user: tx.user });
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const product = tx.product || tx.products?.[0]?.product;
    if (!product || !product.dataDetails) {
      return res.status(400).json({ success: false, message: 'Invalid product data' });
    }

    let apiResponse;
    try {
      apiResponse = await buyData({
        network:   product.dataDetails.network === 'MTN' ? 1 : 2,
        phone:     tx.phone,
        data_plan: product.dataDetails.plan_id
      });
    } catch (err) {
      apiResponse = { status: 'fail', message: 'API error' };
    }

    if (apiResponse.status === 'success') {
      if (wallet.balances.NAIRA < tx.amount) {
        return res.json({ success: false, message: 'Insufficient balance' });
      }
      wallet.balances.NAIRA -= tx.amount;
      await wallet.save();
      tx.status = 'success';

      if (tx.rpEarned > 0) {
        await User.findByIdAndUpdate(tx.user, { $inc: { rpBalance: tx.rpEarned } });
      }
    } else {
      tx.status = 'failed';
    }

    tx.apiResponse = apiResponse;
    await tx.save();

    res.json({ success: tx.status === 'success', message: apiResponse.message });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Retry failed' });
  }
};
