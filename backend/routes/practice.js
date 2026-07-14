const express = require('express');
const router = express.Router();
const PracticeInfo = require('../models/PracticeInfo');
const { auth } = require('../middleware/auth');

// @route   GET api/practice
// @desc    Get current practice info profile
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let practice = await PracticeInfo.findOne();
        if (!practice) {
            // Return empty structure so frontend doesn't crash
            return res.json({
                practiceName: '',
                phoneCountry: 'US',
                phoneNumber: '',
                email: '',
                website: '',
                registrationNumber: '',
                legalName: '',
                faxNumber: '',
                country: '',
                city: '',
                stateProvince: '',
                street: '',
                zipPostalCode: '',
                timeZone: '',
                logo: '',
                facebookUrl: '',
                instagramUrl: '',
                linkedinUrl: '',
                googleBusinessUrl: '',
                twitterUrl: '',
                yelpUrl: '',
                currentStep: 1
            });
        }
        res.json(practice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/practice
// @desc    Save/Update practice info profile
// @access  Private
router.post('/', auth, async (req, res) => {
    const {
        practiceName, phoneCountry, phoneNumber, email, website,
        registrationNumber, legalName, faxNumber, country, city,
        stateProvince, street, zipPostalCode, timeZone, logo,
        facebookUrl, instagramUrl, linkedinUrl, googleBusinessUrl,
        twitterUrl, yelpUrl, currentStep
    } = req.body;

    if (!practiceName || !phoneNumber || !city || !stateProvince) {
        return res.status(400).json({ msg: 'Please enter all required fields: Practice Name, Phone Number, City, State/Province.' });
    }

    try {
        let practice = await PracticeInfo.findOne();

        const practiceFields = {
            practiceName,
            phoneCountry: phoneCountry || 'US',
            phoneNumber,
            email: email || '',
            website: website || '',
            registrationNumber: registrationNumber || '',
            legalName: legalName || '',
            faxNumber: faxNumber || '',
            country: country || '',
            city,
            stateProvince,
            street: street || '',
            zipPostalCode: zipPostalCode || '',
            timeZone: timeZone || '',
            logo: logo !== undefined ? logo : '',
            facebookUrl: facebookUrl || '',
            instagramUrl: instagramUrl || '',
            linkedinUrl: linkedinUrl || '',
            googleBusinessUrl: googleBusinessUrl || '',
            twitterUrl: twitterUrl || '',
            yelpUrl: yelpUrl || '',
            currentStep: currentStep || 1
        };

        if (practice) {
            // Update
            practice = await PracticeInfo.findOneAndUpdate(
                { _id: practice._id },
                { $set: practiceFields },
                { new: true }
            );
            return res.json(practice);
        }

        // Create
        practice = new PracticeInfo(practiceFields);
        await practice.save();
        res.json(practice);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const PracticeProvider = require('../models/PracticeProvider');

// @route   GET api/practice/providers
// @desc    Get all providers
// @access  Private
router.get('/providers', auth, async (req, res) => {
    try {
        const providers = await PracticeProvider.find().sort({ createdAt: 1 });
        res.json(providers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/practice/providers
// @desc    Add a provider
// @access  Private
router.post('/providers', auth, async (req, res) => {
    const {
        firstName, lastName, preferredName, internalCodeName,
        phoneCountry, phoneNumber, email, licenseNumber, npi,
        federalTaxNumber, dea, specialty, taxIdType, providerType,
        profileColor, signatureOnFile
    } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email || !licenseNumber || !federalTaxNumber || !specialty) {
        return res.status(400).json({ msg: 'Please fill out all required fields: First Name, Last Name, Phone, Email, License, Federal Tax, Specialty.' });
    }

    try {
        const newProvider = new PracticeProvider({
            firstName,
            lastName,
            preferredName: preferredName || '',
            internalCodeName: internalCodeName || '',
            phoneCountry: phoneCountry || 'US',
            phoneNumber,
            email,
            licenseNumber,
            npi: npi || '',
            federalTaxNumber,
            dea: dea || '',
            specialty,
            taxIdType: taxIdType || '',
            providerType: providerType || 'Dentist',
            profileColor: profileColor || '#f97316',
            signatureOnFile: !!signatureOnFile
        });
        const provider = await newProvider.save();
        res.json(provider);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/practice/providers/:id
// @desc    Delete a provider
// @access  Private
router.delete('/providers/:id', auth, async (req, res) => {
    try {
        const provider = await PracticeProvider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ msg: 'Provider not found.' });
        }
        await PracticeProvider.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Provider deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
