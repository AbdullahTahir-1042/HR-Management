const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
const Department = require('./models/Department');
const OfficeSchedule = require('./models/OfficeSchedule');

require('dotenv').config({ path: './.env' });

async function fixLatecomers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        
        const todayStr = new Date().toISOString().split('T')[0];
        const records = await Attendance.find({}).populate({
            path: 'employee',
            populate: {
                path: 'departmentId'
            }
        });

        let updatedCount = 0;

        for (const record of records) {
            if (!record.checkIn || record.status === 'absent') continue;

            const employeeUser = record.employee;
            let expectedStartStr = '09:00';
            let expectedEndStr = '19:00';
            let appliedGracePeriod = 0;

            if (employeeUser && employeeUser.shiftDetails && employeeUser.shiftDetails.startTime && employeeUser.shiftDetails.endTime) {
                expectedStartStr = employeeUser.shiftDetails.startTime;
                expectedEndStr = employeeUser.shiftDetails.endTime;
                appliedGracePeriod = employeeUser.shiftDetails.gracePeriod || 0;
            } else if (employeeUser && employeeUser.departmentId && employeeUser.departmentId.shiftDetails && employeeUser.departmentId.shiftDetails.startTime && employeeUser.departmentId.shiftDetails.endTime) {
                expectedStartStr = employeeUser.departmentId.shiftDetails.startTime;
                expectedEndStr = employeeUser.departmentId.shiftDetails.endTime;
                appliedGracePeriod = employeeUser.departmentId.shiftDetails.gracePeriod || 0;
            } else {
                let schedule = await OfficeSchedule.findOne({ date: todayStr, isDefault: false });
                if (!schedule) {
                    schedule = await OfficeSchedule.findOne({ isDefault: true });
                }
                if (schedule) {
                    expectedStartStr = schedule.startTime || '09:00';
                    expectedEndStr = schedule.endTime || '19:00';
                    appliedGracePeriod = schedule.gracePeriod || 0;
                }
            }

            const [startHour, startMin] = expectedStartStr.split(':').map(Number);
            const checkInDate = new Date(record.checkIn);
            
            // Reconstruct the expected check in time on the day they checked in
            const expectedTime = new Date(record.checkIn);
            expectedTime.setHours(startHour, startMin + appliedGracePeriod, 0, 0);

            if (checkInDate > expectedTime) {
                if (record.status !== 'late') {
                    record.status = 'late';
                    record.expectedCheckIn = expectedStartStr;
                    record.expectedCheckOut = expectedEndStr;
                    await record.save();
                    console.log(`Fixed ${employeeUser.name} - Marked as Late`);
                    updatedCount++;
                }
            } else {
                if (record.status !== 'present') {
                    record.status = 'present';
                    record.expectedCheckIn = expectedStartStr;
                    record.expectedCheckOut = expectedEndStr;
                    await record.save();
                    console.log(`Fixed ${employeeUser.name} - Marked as Present`);
                    updatedCount++;
                }
            }
        }
        console.log(`Done. Updated ${updatedCount} records.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixLatecomers();
