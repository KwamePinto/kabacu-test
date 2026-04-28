const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, 
        required: true, 
        unique:true,
        match:/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    },
    //country: { type: String, required: true },
    minerId: { type: Number, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    walletBalance: {
        type: Number,
        default: 0
},
    checkout:{
        type: mongoose.Schema.Types.ObjectId,
            ref: 'checkout',
    },
      cart:{
        type: mongoose.Schema.Types.ObjectId,
            ref: 'cart',
    },
      wallet:{
        type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
    },
     topUp:{
        type: mongoose.Schema.Types.ObjectId,
            ref: 'TopUp',
    }


})

const UserModel = mongoose.model('user', userSchema);
module.exports = UserModel;
