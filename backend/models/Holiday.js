const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['public', 'optional', 'restricted'],
        default: 'public'
    }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);