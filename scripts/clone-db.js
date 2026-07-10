/**
 * Clone production DB (MONGO_URI / ecom) → test DB (TEST_MONGO_URI / ecom)
 * Usage: node scripts/clone-db.js
 *
 * What it does:
 *   - Connects to both Atlas clusters
 *   - For every collection in the source:
 *       1. Drops the target collection (clean slate)
 *       2. Streams all documents in batches and bulk-inserts into target
 *       3. Recreates all indexes (except the default _id index)
 *   - Reports per-collection counts and total time
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const SOURCE_URI = process.env.MONGO_URI.trim();
const RAW_TEST_URI = process.env.TEST_MONGO_URI.trim();
const DB_NAME = 'ecom';
const BATCH_SIZE = 500;

// Append DB name to test URI if not present
const TARGET_URI = RAW_TEST_URI.endsWith('/')
  ? RAW_TEST_URI + DB_NAME
  : RAW_TEST_URI.includes('?')
    ? RAW_TEST_URI.replace('?', `/${DB_NAME}?`)
    : `${RAW_TEST_URI}/${DB_NAME}`;

async function cloneCollection(srcDb, tgtDb, name) {
  const srcCol = srcDb.collection(name);
  const tgtCol = tgtDb.collection(name);

  // Drop target collection for a clean slate
  await tgtCol.drop().catch(() => {}); // ignore "ns not found" error

  // Stream documents in batches
  let inserted = 0;
  let batch = [];

  const cursor = srcCol.find({});
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await tgtCol.insertMany(batch, { ordered: false });
      inserted += batch.length;
      batch = [];
    }
  }
  if (batch.length > 0) {
    await tgtCol.insertMany(batch, { ordered: false });
    inserted += batch.length;
  }

  // Copy indexes (skip _id_ which is auto-created)
  const indexes = await srcCol.indexes();
  const customIndexes = indexes.filter(idx => idx.name !== '_id_');
  if (customIndexes.length > 0) {
    const indexSpecs = customIndexes.map(({ key, name, unique, sparse, expireAfterSeconds }) => {
      const spec = { key, name };
      if (unique) spec.unique = true;
      if (sparse) spec.sparse = true;
      if (expireAfterSeconds != null) spec.expireAfterSeconds = expireAfterSeconds;
      return spec;
    });
    await tgtCol.createIndexes(indexSpecs).catch(err => {
      console.warn(`  [WARN] Index copy for ${name}:`, err.message);
    });
  }

  return inserted;
}

async function main() {
  console.log('Connecting to source and target...');
  const [srcClient, tgtClient] = await Promise.all([
    MongoClient.connect(SOURCE_URI),
    MongoClient.connect(TARGET_URI),
  ]);

  const srcDb = srcClient.db(DB_NAME);
  const tgtDb = tgtClient.db(DB_NAME);

  const collections = await srcDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in source.\n`);

  const start = Date.now();
  let totalDocs = 0;

  for (const { name } of collections) {
    process.stdout.write(`  Cloning "${name}"... `);
    const count = await cloneCollection(srcDb, tgtDb, name);
    totalDocs += count;
    console.log(`${count} docs`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone. ${totalDocs} total documents cloned in ${elapsed}s.`);
  console.log(`Target DB: ${DB_NAME} on cluster0.uxlikhc.mongodb.net`);

  await srcClient.close();
  await tgtClient.close();
}

main().catch(err => {
  console.error('\nClone failed:', err.message);
  process.exit(1);
});
