const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['dm', 'group'],
        required: true
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
