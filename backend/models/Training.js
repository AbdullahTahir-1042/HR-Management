const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    visibility: {
        type: String,
        enum: ['Everyone', 'Specific Department'],
        default: 'Everyone'
    },
    resourceType: {
        type: String,
        enum: ['Video', 'Document'],
        default: 'Video'
    },
    documentUrl: {
        type: String,
        required: false
    },
    fileId: {
        type: String,
        required: false
    },
    youtubeId: {
        type: String,
        required: false
    },
    thumbnail: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingSchema);
