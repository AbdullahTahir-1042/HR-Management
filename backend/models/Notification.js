const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['leave', 'announcement', 'increment', 'promotion', 'system', 'chat'],
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        // Could be a LeaveRequest ID, Increment ID, etc.
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
