const mongoose = require('mongoose');

const OnboardingTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'General'
    },
    link: {
        type: String,
        default: ''
    },
    completedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('OnboardingTask', OnboardingTaskSchema);
