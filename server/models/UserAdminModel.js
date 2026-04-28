const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userAdminSchema = new Schema({
    username: { type: String, required: true },
    email: { 
        type: String, 
        required: true,
        unique:true,
        match:/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
     },
    password: { type: String, required: true },
    role: { type: String, required: true }


})

const UserAdminModel = mongoose.model('userAdmin', userAdminSchema);
module.exports = UserAdminModel;
