const mongoose = require('mongoose');

// Ephemeral typing-indicator state. No message history here — a row just
// means "this user was typing in this conversation until typingUntil".
const TypingStatusSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    typingUntil: {
        type: Date,
        required: true
    }
});

TypingStatusSchema.index({ conversation: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TypingStatus', TypingStatusSchema);
