const mongoose = require('mongoose');

const PayrollDeductionSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    payrollMonth: {
        type: String, // Format: YYYY-MM
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PayrollDeduction', PayrollDeductionSchema);
