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
        enum: ['employee', 'hr', 'admin'],
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
    isFirstLogin: {
        type: Boolean,
        default: true
    },
    notificationPreferences: {
        all: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        leaves: { type: Boolean, default: true },
        attendance: { type: Boolean, default: true }
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