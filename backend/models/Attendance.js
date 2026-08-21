const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD for easy querying per day
        required: true
    },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half-day'],
        default: 'present'
    },
    reason: {
        type: String,
        default: ''
    },
    expectedCheckIn: {
        type: String, // e.g. "09:00"
        default: null
    },
    expectedCheckOut: {
        type: String, // e.g. "19:00"
        default: null
    },
    hasReceivedCheckoutReminder: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Ensure one record per employee per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
