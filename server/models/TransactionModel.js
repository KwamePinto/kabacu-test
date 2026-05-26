const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ✅ SINGLE PRODUCT (optional)
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },

    // ✅ MULTIPLE PRODUCTS (cart)
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },

            quantity: {
                type: Number,
                default: 1
            }
        }
    ],

    phone: String,

    amount: Number,

    walletType: {
        type: String,
        default: 'NAIRA'
    },

    paymentMethod: {
        type: String,
        default: 'PalmPay'
    },

    status: {
        type: String,

        enum: [
            'pending',
            'processing',
            'success',
            'failed',
            'refunded'
        ],

        default: 'pending'
    },

    reference: {
        type: String,
        unique: true
    },

    palmPayOrderId: String,

    sdkSessionId: String,

    payToken: String,

    checkoutUrl: String,

    walletCredited: {
        type: Boolean,
        default: false
    },

    webhookVerified: {
        type: Boolean,
        default: false
    },
    rpEarned: {
    type: Number,
    default: 0
},

    apiResponse: {
        type: Object
    },

    webhookData: {
        type: Object
    },

    refundedAt: Date

}, {
    timestamps: true
});

module.exports = mongoose.model(
    'Transaction',
    transactionSchema
);