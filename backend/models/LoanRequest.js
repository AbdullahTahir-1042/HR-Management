const mongoose = require('mongoose');

const LoanRequestSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Employee Submitted Fields
    requestedAmount: {
        type: Number,
        required: true,
        min: [1000, 'Loan amount must be at least 1,000']
    },
    purpose: {
        type: String,
        enum: ['Emergency', 'Medical', 'Education', 'Personal', 'Housing', 'Travel', 'Other'],
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    preferredInstallments: {
        type: Number,
        required: true,
        min: 1,
        max: 36
    },
    preferredStartMonth: {
        type: String, // Format: YYYY-MM
        required: true
    },
    supportingDocument: {
        type: String,
        default: ''
    },
    employeeNotes: {
        type: String,
        default: ''
    },

    // HR Approved Terms
    approvedAmount: {
        type: Number,
        default: 0
    },
    approvedInstallments: {
        type: Number,
        default: 0
    },
    monthlyDeduction: {
        type: Number,
        default: 0
    },
    repaymentStartMonth: {
        type: String,
        default: ''
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },

    // Lifecycle Status
    status: {
        type: String,
        enum: ['Pending', 'Revision Requested', 'Approved', 'Active', 'Rejected', 'Completed', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    hrReviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hrNotes: {
        type: String,
        default: ''
    },
    reviewedAt: {
        type: Date
    },

    // Deductions Audit Log
    repaymentLogs: [{
        payrollMonth: String, // Format: YYYY-MM
        amountDeducted: Number,
        remainingBalanceAfter: Number,
        deductedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('LoanRequest', LoanRequestSchema);
