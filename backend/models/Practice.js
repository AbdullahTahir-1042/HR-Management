const mongoose = require('mongoose');

const PracticeSchema = new mongoose.Schema({
    practiceName: {
        type: String,
        required: true
    },
    phoneCountry: {
        type: String,
        default: 'us'
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
    logo: {
        type: String, // Store base64 encoded image
        default: ''
    },
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
    providers: [
        {
            name: { type: String, required: true },
            specialty: { type: String, required: true },
            type: { type: String, default: '' },
            email: { type: String, default: '' },
            phone: { type: String, default: '—' }
        }
    ],
    users: [
        {
            name: { type: String, required: true },
            role: { type: String, required: true }
        }
    ],
    openingHours: [
        {
            day: { type: String, required: true },
            open: { type: String, default: '09:00 AM' },
            close: { type: String, default: '05:00 PM' },
            active: { type: Boolean, default: true }
        }
    ],
    scheduleConfig: {
        slotDuration: { type: String, default: '30 mins' },
        allowOnlineBooking: { type: Boolean, default: true },
        calendarColor: { type: String, default: '#2563eb' }
    },
    billingConfig: {
        paymentProcessor: { type: String, default: 'stripe' },
        taxRate: { type: String, default: '8.25' },
        currency: { type: String, default: 'USD' }
    },
    currentStep: {
        type: Number,
        default: 1
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Practice', PracticeSchema);
