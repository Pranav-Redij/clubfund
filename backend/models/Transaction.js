const mongoose = require('mongoose');

// Each split entry stores: who owes how much from this transaction
const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    // splits: array of { user, amount } — who owes how much from this expense
    // paidBy is NOT in splits (they paid, so they don't owe)
    splits: [splitSchema]
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
