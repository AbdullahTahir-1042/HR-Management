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
    }
}, { timestamps: true });

module.exports = mongoose.model('LeaveType', LeaveTypeSchema);
