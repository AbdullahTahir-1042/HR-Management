const mongoose = require('mongoose');

const OfficeScheduleSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        default: null
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: String, // Format: HH:mm (e.g., '09:00')
        required: true
    },
    endTime: {
        type: String, // Format: HH:mm (e.g., '18:00')
        required: true
    },
    gracePeriod: {
        type: Number, // In minutes
        required: true,
        default: 15
    },
    workingDays: {
        type: [Number], // 0-6 where 0 is Sunday, 1 is Monday, etc.
        default: [1, 2, 3, 4, 5] // Default: Monday to Friday
    },
    reason: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// A compound index to ensure there's only one default schedule or one schedule per specific date
OfficeScheduleSchema.index({ date: 1, isDefault: 1 }, { unique: true });

module.exports = mongoose.model('OfficeSchedule', OfficeScheduleSchema);
