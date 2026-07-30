const mongoose = require('mongoose');

const IncrementSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    incrementDate: {
        type: Date,
        required: true
    },
    previousSalary: {
        type: Number,
        required: true,
        min: 0
    },
    incrementAmount: {
        type: Number,
        required: true,
        min: 0
    },
    newSalary: {
        type: Number,
        required: true,
        min: 0
    },
    incrementPercentage: {
        type: Number,
        default: 0
    },
    promotionRank: {
        type: String,
        enum: ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'],
        default: null
    },
    reason: {
        type: String,
        required: true
    },
    approvedBy: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Increment', IncrementSchema);
