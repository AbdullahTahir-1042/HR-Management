const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const createHR = async () => {
    const name = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if (!name || !email || !password) {
        console.log('Usage: node createHR.js <name> <email> <password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists');
            process.exit(1);
        }

        user = new User({ name, email, password, role: 'hr' });
        await user.save();
        
        console.log(`HR User Created: ${name} (${email})`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createHR();
