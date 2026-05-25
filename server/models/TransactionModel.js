const mongoose = require('mongoose');

const transactionSchema =
new mongoose.Schema({

    user: {
        type:
            mongoose.Schema.Types.ObjectId,

        ref: 'user',

        required: true
    },

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

    // =====================================
    // PAYMENT STATUS
    // =====================================

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

    // =====================================
    // REFERENCES
    // =====================================

    reference: {

        type: String,

        unique: true
    },

    palmPayOrderId: String,

    sdkSessionId: String,

    payToken: String,

    checkoutUrl: String,

    // =====================================
    // SECURITY / PROCESSING
    // =====================================

    walletCredited: {

        type: Boolean,

        default: false
    },

    webhookVerified: {

        type: Boolean,

        default: false
    },

    // =====================================
    // RAW RESPONSES
    // =====================================

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

module.exports =
mongoose.model(
    'Transaction',
    transactionSchema
);