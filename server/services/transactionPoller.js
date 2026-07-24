const Transaction = require('../models/TransactionModel');
const Wallet      = require('../models/WalletModal');
const User        = require('../models/UserModel');
const { getTransactionStatus } = require('./ourdatastore');
const logger = require('../config/logger');

const POLL_INTERVAL_MS   = 2  * 60 * 1000; // check every 2 minutes
const AUTO_REFUND_AFTER_MS = 30 * 60 * 1000; // auto-refund after 30 minutes

async function pollPendingTransactions() {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const pending = await Transaction.find({
    status: 'pending',
    createdAt: { $lt: twoMinutesAgo },
  });

  if (!pending.length) return;
  logger.info(`[POLLER] Checking ${pending.length} pending transaction(s)`);

  for (const tx of pending) {
    try {
      const age       = Date.now() - new Date(tx.createdAt).getTime();
      const requestId = tx.apiResponse?.requestId;

      if (age > AUTO_REFUND_AFTER_MS) {
        await refundAndFail(tx, 'pending for over 30 minutes');
        continue;
      }

      if (!requestId) {
        logger.warn(`[POLLER] TX ${tx._id}: no requestId in apiResponse, skipping`);
        continue;
      }

      const planStatus = await getTransactionStatus(requestId);
      logger.info(`[POLLER] TX ${tx._id} (${requestId}) plan_status=${planStatus}`);

      if (planStatus === 1) {
        tx.status = 'success';
        await tx.save();
        if (tx.rpEarned > 0) {
          await User.findByIdAndUpdate(tx.user, { $inc: { rpBalance: tx.rpEarned } });
        }
        logger.info(`[POLLER] TX ${tx._id} → SUCCESS`);
      } else if (planStatus === 2) {
        await refundAndFail(tx, 'provider confirmed failure');
      }
      // plan_status 3 (still processing) or null (not found yet): leave pending
    } catch (err) {
      logger.error(`[POLLER] Error on TX ${tx._id}: ${err.message}`);
    }
  }
}

async function refundAndFail(tx, reason) {
  if (tx.walletType === 'NAIRA') {
    const wallet = await Wallet.findOne({ user: tx.user });
    if (wallet) {
      wallet.balances.NAIRA += tx.amount;
      await wallet.save();
    }
  }
  tx.status = 'failed';
  await tx.save();
  logger.info(`[POLLER] TX ${tx._id} → FAILED & refunded (${reason})`);
}

function startPoller() {
  setInterval(async () => {
    try { await pollPendingTransactions(); }
    catch (err) { logger.error(`[POLLER] Unhandled error: ${err.message}`); }
  }, POLL_INTERVAL_MS);
  logger.info('[POLLER] Transaction poller started — interval: 2 min, auto-refund after: 30 min');
}

module.exports = { startPoller, pollPendingTransactions };
