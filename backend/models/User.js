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
        enum: ['full time', 'probation', 'internship'],
        default: 'full time'
    },
    salary: {
        type: Number,
        default: 0
    },
    photo: {
        type: String, // URL or base64
        default: ''
    },
    department: {
        type: String,
        default: 'development'
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
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);