require('dotenv').config();
const mongoose       = require('mongoose');
const bcrypt         = require('bcrypt');
const UserAdminModel = require('../server/models/UserAdminModel');

const TARGET_EMAIL   = 'test@minebittoken.com';
const NEW_PASSWORD   = 'pass123';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');

  const admin = await UserAdminModel.findOne({ email: TARGET_EMAIL });
  if (!admin) {
    console.error(`No admin account found with email: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  console.log(`Found: ${admin.username} (${admin.role})`);

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
  admin.password = hashed;
  await admin.save();

  console.log(`Password updated successfully for ${admin.email}`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
