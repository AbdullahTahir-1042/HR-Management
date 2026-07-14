const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Practice = require('../models/Practice');

// @route   GET api/practice/current
// @desc    Get the latest practice onboarding details
// @access  Private
router.get('/current', auth, async (req, res) => {
    try {
        // Fetch the most recently updated or created practice configuration
        const practice = await Practice.findOne().sort({ updatedAt: -1 });
        if (!practice) {
            return res.status(404).json({ msg: 'No practice configuration found' });
        }
        res.json(practice);
    } catch (err) {
        console.error('Error fetching practice details:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/practice/save
// @desc    Create or update practice onboarding details
// @access  Private
router.post('/save', auth, async (req, res) => {
    const {
        practiceName,
        phoneCountry,
        phoneNumber,
        email,
        website,
        registrationNumber,
        legalName,
        faxNumber,
        country,
        city,
        stateProvince,
        street,
        zipPostalCode,
        timeZone,
        logo,
        facebookUrl,
        instagramUrl,
        linkedinUrl,
        googleBusinessUrl,
        twitterUrl,
        yelpUrl,
        providers,
        users,
        openingHours,
        scheduleConfig,
        billingConfig,
        currentStep,
        isCompleted
    } = req.body;

    // Basic validation
    if (!practiceName || !phoneNumber || !city || !stateProvince) {
        return res.status(400).json({ msg: 'Please enter all required fields: Practice Name, Phone Number, City, State/Province.' });
    }

    try {
        // Look up the latest practice, if it exists we update it, otherwise create new
        let practice = await Practice.findOne().sort({ updatedAt: -1 });

        const practiceFields = {
            practiceName,
            phoneCountry: phoneCountry || 'us',
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
            logo: logo || '',
            facebookUrl: facebookUrl || '',
            instagramUrl: instagramUrl || '',
            linkedinUrl: linkedinUrl || '',
            googleBusinessUrl: googleBusinessUrl || '',
            twitterUrl: twitterUrl || '',
            yelpUrl: yelpUrl || '',
            providers: providers || [],
            users: users || [],
            openingHours: openingHours || [],
            scheduleConfig: scheduleConfig || { slotDuration: '30 mins', allowOnlineBooking: true, calendarColor: '#2563eb' },
            billingConfig: billingConfig || { paymentProcessor: 'stripe', taxRate: '8.25', currency: 'USD' },
            currentStep: currentStep || 1,
            isCompleted: isCompleted || false
        };

        if (practice) {
            // Update existing practice setup
            practice = await Practice.findByIdAndUpdate(
                practice._id,
                { $set: practiceFields },
                { new: true }
            );
        } else {
            // Create new practice setup
            practice = new Practice(practiceFields);
            await practice.save();
        }

        res.json(practice);
    } catch (err) {
        console.error('Error saving practice onboarding details:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
