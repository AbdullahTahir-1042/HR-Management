const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    leaveType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveType',
        required: true
    },
    status: {
        type: String,
        enum: ['pending_hr', 'pending_team_lead', 'approved', 'hr_rejected', 'rejected'],
        default: 'pending_hr'
    },
    hrRemark: {
        type: String,
        default: ''
    },
    hrDecision: {
        type: String,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending'
    },
    hrReviewedAt: {
        type: Date
    },
    teamLeadRemark: {
        type: String,
        default: ''
    },
    teamLeadDecision: {
        type: String,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending'
    },
    teamLeadReviewedAt: {
        type: Date
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    isHalfDay: {
        type: Boolean,
        default: false
    },
    halfDayPeriod: {
        type: String,
        enum: ['First Half', 'Second Half', ''],
        default: ''
    }
}, { timestamps: true });

LeaveRequestSchema.index({ employee: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
