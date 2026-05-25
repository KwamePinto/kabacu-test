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
    minerId: { type: Number, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    walletBalance: {
        type: Number,
        default: 0
},
loginAttempts: {
    type: Number,
    default: 0
},

lockUntil: Date,

// isVerified: {
//     type: Boolean,
//     default: false
// },

verificationToken: String,

verificationTokenExpires: Date,
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



// document.getElementById('checkoutBtn').addEventListener('click', async () => {
//     const phone = document.getElementById('phoneInput').value;

//     // ✅ pick whichever exists
//     const productId = window.selectedProductId || selectedPackageId;

//     if (!phone) {
//         Swal.fire({
//             icon: 'warning',
//             text: 'Enter phone number'
//         });
//         return;
//     }

//     if (!productId) {
//         Swal.fire({
//             icon: 'error',
//             text: 'No product selected'
//         });
//         return;
//     }

//     try {
//         const res = await fetch('/checkout/initiate', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ packageId: productId, phone }) // ✅ unified
//         });

//         const data = await res.json();

//         if (data.success) {
//             window.location.href = '/checkout';
//         } else {
//             Swal.fire({
//                 icon: 'error',
//                 text: data.message || 'Something went wrong'
//             });
//         }

//     } catch (err) {
//         console.error(err);
//         Swal.fire({
//             icon: 'error',
//             text: 'Network error'
//         });
//     }
// });
