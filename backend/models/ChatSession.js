const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Ensure one chat thread per user for now
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'model', 'function'],
                required: true
            },
            parts: {
                type: mongoose.Schema.Types.Mixed, // Can be array of text or function calls
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
