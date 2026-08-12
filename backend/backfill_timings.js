const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
require('dotenv').config();

async function backfill() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Fix ALL records BEFORE Aug 10 to use old 9:30 AM timing
        const oldScheduleRecords = await Attendance.find({
            date: { $lt: '2026-08-10' }
        });
        console.log(`Found ${oldScheduleRecords.length} records before Aug 10`);

        let oldCount = 0;
        for (const record of oldScheduleRecords) {
            record.expectedCheckIn = '09:30';
            record.expectedCheckOut = '18:30';
            
            if (record.checkIn) {
                const checkInDate = new Date(record.checkIn);
                const threshold = new Date(record.checkIn);
                // 09:30 + 15 min grace = end of 09:45 minute (09:45:59.999)
                threshold.setHours(9, 45, 59, 999);
                record.status = checkInDate > threshold ? 'late' : 'present';
            }
            
            await record.save();
            oldCount++;
        }
        console.log(`Fixed ${oldCount} records to 09:30 AM timing`);

        // Fix records from Aug 10 onwards to use new 10:30 AM timing
        const newScheduleRecords = await Attendance.find({
            date: { $gte: '2026-08-10' }
        });
        console.log(`Found ${newScheduleRecords.length} records from Aug 10 onwards`);

        let newCount = 0;
        for (const record of newScheduleRecords) {
            record.expectedCheckIn = '10:30';
            record.expectedCheckOut = '19:30';
            
            if (record.checkIn) {
                const checkInDate = new Date(record.checkIn);
                const threshold = new Date(record.checkIn);
                // 10:30 + 15 min grace = end of 10:45 minute (10:45:59.999)
                threshold.setHours(10, 45, 59, 999);
                record.status = checkInDate > threshold ? 'late' : 'present';
            }
            
            await record.save();
            newCount++;
        }
        console.log(`Fixed ${newCount} records to 10:30 AM timing`);

        console.log('Done! All attendance records corrected.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

backfill();
