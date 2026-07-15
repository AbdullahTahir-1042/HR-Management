const mongoose = require('mongoose');

const HRRequestSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'Attendance Correction',
            'Experience Letter',
            'Salary Slip',
            'Work From Home',
            'Other'
        ],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Review', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    hrNote: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('HRRequest', HRRequestSchema);