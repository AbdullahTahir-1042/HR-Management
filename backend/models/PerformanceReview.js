const mongoose = require('mongoose');

const PerformanceReviewSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewDate: {
        type: Date,
        required: true
    },
    reviewPeriod: {
        type: String,
        required: true
    },
    reviewer: {
        type: String,
        required: true
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comments: {
        type: String,
        required: true
    },
    strengths: {
        type: String,
        default: ''
    },
    areasForImprovement: {
        type: String,
        default: ''
    },
    goals: {
        type: String,
        default: ''
    },
    nextReviewDate: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceReview', PerformanceReviewSchema);
