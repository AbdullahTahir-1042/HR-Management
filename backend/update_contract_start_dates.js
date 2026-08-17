require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hr_management';

mongoose.connect(DB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({});
        console.log(`Found ${users.length} users. Migrating contract start dates...`);
        let updatedCount = 0;
        for (let user of users) {
            // Set contract startDate to createdAt (joining date)
            if (user.createdAt) {
                user.contractDetails = user.contractDetails || {};
                user.contractDetails.startDate = user.createdAt;
                await user.save();
                updatedCount++;
            }
        }
        console.log(`Successfully updated ${updatedCount} users.`);
        process.exit(0);
    })
    .catch(err => {
        console.error('DB Connection error:', err);
        process.exit(1);
    });
