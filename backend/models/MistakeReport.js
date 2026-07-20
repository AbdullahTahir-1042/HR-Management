const mongoose = require('mongoose');

const MistakeReportSchema = new mongoose.Schema({

    // The agent (employee) who made the mistake
    agentName: {
        type: String,
        required: true,
        trim: true
    },
    agentId: {
        // Optional: link to User if you want to notify them
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Clinic / team name
    clinicName: {
        type: String,
        required: true,
        trim: true
    },

    // Patient details
    patientName: {
        type: String,
        required: true,
        trim: true
    },

    // When the mistake happened
    dateOfMistake: {
        type: Date,
        required: true
    },

    // What went wrong — required
    mistakeDescription: {
        type: String,
        required: true,
        trim: true
    },

    // Optional: what the agent should learn
    learning: {
        type: String,
        default: '',
        trim: true
    },

    // Optional: how to improve
    improvement: {
        type: String,
        default: '',
        trim: true
    },

    // The HOD who submitted this report
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // HOD's team name (copied at creation for easy filtering)
    teamName: {
        type: String,
        default: '',
        trim: true
    },

    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    }

}, { timestamps: true }); // createdAt & updatedAt auto-added

module.exports = mongoose.model('MistakeReport', MistakeReportSchema);