/**
 * seed-networks.js
 *
 * Reads every DATA product in the database, extracts unique network names,
 * and creates a Network document for each one (prompting for the API code
 * when it cannot be guessed automatically).
 *
 * Run once after deploying the Networks feature:
 *   node scripts/seed-networks.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../server/models/ProductsModal');
const Network  = require('../server/models/NetworkModel');

// Auto-detect API code from network name (same logic as ourdatastore.js)
function guessCode(name) {
  const n = (name || '').toUpperCase();
  if (n.includes('MTN') || n.includes('CTC')) return 1;
  if (n.includes('GLO'))                       return 2;
  if (n.includes('AIRTEL'))                    return 3;
  if (n.includes('9MOBILE') || n.includes('ETISALAT')) return 4;
  return null;
}

const PROVIDER_LABELS = { 1: 'MTN', 2: 'GLO', 3: 'Airtel', 4: '9mobile' };

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  // Collect all unique network names from DATA products
  const products = await Product.find({ category: 'DATA', 'dataDetails.network': { $exists: true, $ne: '' } }).lean();
  const names    = [...new Set(products.map(p => p.dataDetails?.network).filter(Boolean))];

  console.log(`Found ${names.length} unique network name(s) across ${products.length} DATA products:\n`);

  let created = 0;
  let skipped = 0;

  for (const name of names) {
    const existing = await Network.findOne({ name, is_deleted: { $ne: 1 } });
    if (existing) {
      console.log(`  [SKIP]    "${name}" already exists → ${PROVIDER_LABELS[existing.apiCode]} (${existing.apiCode})`);
      skipped++;
      continue;
    }

    const code = guessCode(name);
    if (code) {
      await Network.create({ name, apiCode: code });
      console.log(`  [CREATED] "${name}" → ${PROVIDER_LABELS[code]} (${code})`);
      created++;
    } else {
      console.log(`  [WARNING] "${name}" — could not auto-detect provider. Add it manually at /admin/networks.`);
    }
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
