const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userAdminSchema = new Schema({
  username:         { type: String, required: true },
  email:            { type: String, required: true, unique: true,
                      match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/ },
  password:         { type: String, required: true },
  role:             { type: String, required: true, enum: ['super_admin', 'senior_admin', 'junior_admin'] },
  phone:            { type: String, default: '' },
  bio:              { type: String, default: '' },
  department:       { type: String, default: '' },
  profileCompleted: { type: Boolean, default: false },
  addedBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'userAdmin', default: null },
}, { timestamps: true });

const UserAdminModel = mongoose.model('userAdmin', userAdminSchema);
module.exports = UserAdminModel;
