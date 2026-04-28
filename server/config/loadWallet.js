// middleware/loadWallet.js
const Wallet = require('../models/WalletModal');

async function loadWallet(req, res, next) {
  try {
    if (!req.user) {
      res.locals.wallet = null;
      return next();
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    res.locals.wallet = wallet || {
      balances: { BTT: 0, RP: 0, USDT: 0 }
    };

  } catch (error) {
    res.locals.wallet = {
      balances: { BTT: 0, RP: 0, USDT: 0 }
    };
  }

  next();
}

module.exports = loadWallet;