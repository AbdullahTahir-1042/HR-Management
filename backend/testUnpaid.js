const mongoose = require('mongoose');
require('dotenv').config();
const LeaveType = require('./models/LeaveType');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const types = await LeaveType.find();
    console.log("Existing Leave Types:", types.map(t => t.name));
    
    // Create an unpaid leave type if none exists
    const hasUnpaid = types.some(t => t.name.toLowerCase().includes('unpaid'));
    if (!hasUnpaid) {
        await LeaveType.create({ name: 'Unpaid Leave', quota: 365, description: 'Leave without pay' });
        console.log("Created 'Unpaid Leave' type.");
    } else {
        console.log("'Unpaid Leave' type already exists.");
    }
    
    process.exit(0);
}

test().catch(console.error);
