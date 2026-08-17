const mongoose = require('mongoose');

const topupSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    amount: {
        type: Number,
        required: true
    },
    nairaAmount:{
      type: Number,
        
    },

    balanceType: {
        type: String,
        enum: [
            'BTT',
            'RP',
            'USDT',
            'NAIRA'
        ],
        required: true
    },

    status: {
        type: String,
        enum: [
            'PENDING',
            'COMPLETED',
            'FAILED'
        ],
        default: 'PENDING'
    },

    reference: {
        type: String,
        unique: true,
        sparse: true
    },

    paymentMethod: {
        type: String
    },

    palmPayOrderId: String,

    sdkSessionId: String,

    payToken: String,

    checkoutUrl: String,

    walletCredited: {
        type: Boolean,
        default: false
    },

    // Wallet balance either side of the credit, so a top-up reads like any
    // other ledger row on the admin account statement. Recorded at credit
    // time; historic rows are filled in by
    // scripts/backfill-statement-balances.js where they can be reconciled.
    balanceBefore: {
        type: Number,
        default: null
    },

    balanceAfter: {
        type: Number,
        default: null
    },

    // 'live'      captured at the moment the wallet was credited
    // 'backfill'  reconstructed afterwards by replaying the ledger
    balanceSource: {
        type: String,
        enum: ['live', 'backfill', null],
        default: null
    },

    webhookVerified: {
        type: Boolean,
        default: false
    },

    apiResponse: Object,

    webhookData: Object,

    expiresAt: {
        type: Date,
        default: () => Date.now() + (5 * 60 * 1000)
    }

}, {
    timestamps: true
});

topupSchema.index({ createdAt: -1 });
topupSchema.index({ user: 1, createdAt: -1 });
topupSchema.index({ status: 1 });

module.exports =
    mongoose.model(
        'TopUp',
        topupSchema
    );