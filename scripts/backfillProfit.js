/**
 * One-time script: backfill markup (profit) on all historical successful transactions.
 *
 * For each successful transaction where markup is 0:
 *   - Single-product tx  → markup = amount - product.costPrice
 *   - Cart tx (products) → markup = amount - sum(product.costPrice * quantity)
 *
 * Uses the product's CURRENT costPrice. If a product's cost price has changed
 * since the original sale, that specific record will be approximate.
 *
 * Usage:
 *   node scripts/backfillProfit.js
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const Transaction = require('../server/models/TransactionModel');
const Product     = require('../server/models/ProductsModal');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Find all successful transactions that have never had a markup set
  const txns = await Transaction.find({ status: 'success', markup: { $lte: 0 } })
    .populate('product', 'costPrice')
    .populate('products.product', 'costPrice');

  console.log(`Found ${txns.length} transaction(s) to backfill.`);

  let updated = 0;
  let skipped = 0;

  for (const tx of txns) {
    let costTotal = 0;

    // Cart purchase — sum cost across all items
    if (tx.products && tx.products.length > 0) {
      for (const item of tx.products) {
        const cost = item.product?.costPrice || 0;
        costTotal += cost * (item.quantity || 1);
      }
    }
    // Single-product purchase
    else if (tx.product) {
      costTotal = tx.product.costPrice || 0;
    }

    const markup = (tx.amount || 0) - costTotal;

    if (markup <= 0) {
      // Skip transactions where cost data is missing or selling price <= cost
      skipped++;
      continue;
    }

    tx.markup = markup;
    await tx.save();
    updated++;
  }

  console.log(`Done. Updated: ${updated} | Skipped (no cost data or zero margin): ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
