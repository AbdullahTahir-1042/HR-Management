const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    quota: {
        type: Number,
        required: true,
        min: [0, 'Quota cannot be negative']
    },
    description: {
        type: String,
        default: ''
    },
    maxConsecutiveDays: {
        type: Number,
        default: 0 // 0 means no limit
    },
    cooldownDays: {
        type: Number,
        default: 0 // 0 means no cooldown
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveType', LeaveTypeSchema);
