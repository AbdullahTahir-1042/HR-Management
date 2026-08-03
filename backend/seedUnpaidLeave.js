const mongoose = require('mongoose');
require('dotenv').config();
const LeaveRequest = require('./models/LeaveRequest');
const LeaveType = require('./models/LeaveType');
const User = require('./models/User');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const unpaidType = await LeaveType.findOne({ name: 'Unpaid Leave' });
    const emp = await User.findOne({ role: 'employee' });
    
    if (unpaidType && emp) {
        console.log(`Testing with Employee: ${emp.email} (Salary: ${emp.salary})`);
        
        // Create an unpaid leave for today
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 1); // 2 days of unpaid leave
        
        await LeaveRequest.create({
            employee: emp._id,
            leaveType: unpaidType._id,
            startDate: start,
            endDate: end,
            reason: 'Testing unpaid deduction',
            status: 'approved'
        });
        console.log("Successfully inserted a 2-day approved Unpaid Leave for this employee.");
        console.log(`They should have a deduction of approximately 2/30th of ${emp.salary} = ${Math.round((emp.salary/30)*2)}`);
    } else {
        console.log("Unpaid leave type or employee not found");
    }
    
    process.exit(0);
}

test().catch(console.error);
