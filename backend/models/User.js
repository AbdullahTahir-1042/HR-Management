const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['employee', 'hr'],
        default: 'employee'
    },
    status: {
        type: String,
        enum: ['full time', 'probation', 'internship', 'Inactive'],
        default: 'full time'
    },
    joiningStatus: {
        type: String,
        enum: ['Intern', 'Fresh Join'],
        default: 'Fresh Join'
    },
    promotionRank: {
        type: String,
        enum: ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'],
        default: 'Junior'
    },
    salary: {
        type: Number,
        default: 0
    },
    photo: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: 'development'
    },
    // Reference to the Department document this user belongs to
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    // True if this employee is the designated Team Lead of their department
    isTeamLead: {
        type: Boolean,
        default: false
    },
    reportingTo: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    leaveBalance: {
        type: Number,
        default: 40
    },
    fcmToken: {
        type: String,
        default: null
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
    hiddenProfileCards: [{
        type: String
    }],
    hiddenCareerCards: [{
        type: String
    }],
    activeLoan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LoanRequest',
        default: null
    },
    contractDetails: {
        contractType: { type: String, default: 'Full-Time' },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        summary: { type: String, default: 'This is a standard employment contract establishing the terms, conditions, and expectations of employment between the company and the employee. It encompasses compensation, benefits, working hours, confidentiality agreements, and termination clauses.' }
    },
    shiftDetails: {
        startTime: { type: String, default: null }, // e.g. "09:00"
        endTime: { type: String, default: null },   // e.g. "19:00"
        gracePeriod: { type: Number, default: 0 }
    },
    isFirstLogin: {
        type: Boolean,
        default: true
    },
    hasReceivedAbsenceWarning: {
        type: Boolean,
        default: false
    },
    notificationPreferences: {
        all: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        leaves: { type: Boolean, default: true },
        attendance: { type: Boolean, default: true }
    },
    resetOtp: {
        type: String,
        default: null
    },
    resetOtpExpire: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);