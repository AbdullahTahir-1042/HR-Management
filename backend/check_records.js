const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
require('./models/User'); // register User schema for populate
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const today = await Attendance.find({ date: '2026-08-12' }).populate('employee', 'name email');
    
    for (const r of today) {
        console.log(`${r.employee?.name || 'Unknown'} | checkIn: ${r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'} | status: ${r.status} | expectedCheckIn: ${r.expectedCheckIn || 'NULL'} | expectedCheckOut: ${r.expectedCheckOut || 'NULL'}`);
    }
    
    process.exit(0);
}
check();
