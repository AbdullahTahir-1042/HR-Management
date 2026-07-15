const mongoose = require('mongoose');

const PracticeProviderSchema = new mongoose.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    preferredName: {
        type: String,
        default: ''
    },
    internalCodeName: {
        type: String,
        default: ''
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
        required: true
    },

    // Professional & Licensing Information
    licenseNumber: {
        type: String,
        required: true
    },
    npi: {
        type: String,
        default: ''
    },
    federalTaxNumber: {
        type: String,
        required: true
    },
    dea: {
        type: String,
        default: ''
    },
    specialty: {
        type: String,
        required: true
    },

    // Provider Type & Tax Detail
    taxIdType: {
        type: String,
        default: ''
    },
    providerType: {
        type: String,
        default: 'Dentist'
    },

    // Profile Background Color
    profileColor: {
        type: String,
        default: '#f97316' // default to first orange swatch
    },
    signatureOnFile: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('PracticeProvider', PracticeProviderSchema);
