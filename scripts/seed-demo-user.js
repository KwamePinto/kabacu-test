require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const UserModel = require('../server/models/UserModel');
const Wallet    = require('../server/models/WalletModal');

const DEMO = {
  username:     'demo',
  email:        'demo@ctc.com',
  password:     'Demo@1234',
  phone_number: '+2348012345678',
  role:         'users'
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');

  const existing = await UserModel.findOne({ email: DEMO.email });
  if (existing) {
    console.log('Demo user already exists — skipping.');
    process.exit(0);
  }

  const hashed = await bcrypt.hash(DEMO.password, 10);

  const user = await UserModel.create({
    username:     DEMO.username,
    email:        DEMO.email,
    password:     hashed,
    phone_number: DEMO.phone_number,
    role:         DEMO.role
  });

  await Wallet.create({
    user:     user._id,
    balances: { BTT: 0, RP: 0, USDT: 0, NAIRA: 5000 }
  });

  console.log('Demo user created:');
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log(`  Naira wallet seeded with ₦5,000`);

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
