require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create a user with a plain password
    const plain = "Testing123";
    const user = new User({
        name: "Test User",
        email: "test.change@example.com",
        password: plain, // pre-save should hash it
        role: "employee",
        status: "full time",
        joiningStatus: "Fresh Join"
    });
    await user.save();
    
    console.log("Original hashed password:", user.password);
    
    // Now simulate change-first-password
    const foundUser = await User.findById(user._id);
    const newPass = "NewPass123";
    foundUser.password = newPass;
    foundUser.isFirstLogin = false;
    await foundUser.save();
    
    console.log("New hashed password:", foundUser.password);
    
    // Verify
    const matchOld = await bcrypt.compare(plain, foundUser.password);
    const matchNew = await bcrypt.compare(newPass, foundUser.password);
    
    console.log("Matches old?", matchOld);
    console.log("Matches new?", matchNew);
    
    // Cleanup
    await User.findByIdAndDelete(user._id);
    process.exit(0);
}

test().catch(console.error);
