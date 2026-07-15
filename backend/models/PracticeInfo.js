const mongoose = require('mongoose');

const PracticeInfoSchema = new mongoose.Schema({
    // Practice Information
    practiceName: {
        type: String,
        required: true
    },
    phoneCountry: {
        type: String,
        default: 'US'
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    registrationNumber: {
        type: String,
        default: ''
    },
    legalName: {
        type: String,
        default: ''
    },
    faxNumber: {
        type: String,
        default: ''
    },

    // Address & Location Details
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        required: true
    },
    stateProvince: {
        type: String,
        required: true
    },
    street: {
        type: String,
        default: ''
    },
    zipPostalCode: {
        type: String,
        default: ''
    },
    timeZone: {
        type: String,
        default: ''
    },

    // Logo image (Base64 string or URL)
    logo: {
        type: String,
        default: ''
    },

    // Social Media Links
    facebookUrl: {
        type: String,
        default: ''
    },
    instagramUrl: {
        type: String,
        default: ''
    },
    linkedinUrl: {
        type: String,
        default: ''
    },
    googleBusinessUrl: {
        type: String,
        default: ''
    },
    twitterUrl: {
        type: String,
        default: ''
    },
    yelpUrl: {
        type: String,
        default: ''
    },

    currentStep: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model('PracticeInfo', PracticeInfoSchema);
