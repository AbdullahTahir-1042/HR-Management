require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const HRRequest = require('./models/HRRequest');
const Attendance = require('./models/Attendance');

// Import the Haversine function so we can mock the exact route logic
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

async function mockCheckIn(userId, latitude, longitude) {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. WFH Exemption check
    const todayDateStart = new Date(today);
    todayDateStart.setHours(0, 0, 0, 0);
    const todayDateEnd = new Date(today);
    todayDateEnd.setHours(23, 59, 59, 999);

    const approvedWFH = await HRRequest.findOne({
        employee: userId,
        type: 'Work From Home',
        status: 'Resolved',
        targetDate: { $gte: todayDateStart, $lte: todayDateEnd }
    });

    // 2. Geofence logic
    if (!approvedWFH) {
        const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
        const officeLng = parseFloat(process.env.OFFICE_LONGITUDE);
        const maxRadius = parseFloat(process.env.GEOFENCE_RADIUS_METERS || 200);

        const distance = getDistanceFromLatLonInM(latitude, longitude, officeLat, officeLng);
        if (distance > maxRadius) {
            return { success: false, msg: `Too far (Distance: ${Math.round(distance)}m)` };
        }
    } else {
        console.log(`[SYS] User has approved WFH for today. Bypassing geofence.`);
    }

    // Save attendance if it passes
    let attendance = new Attendance({ employee: userId, date: today, checkIn: new Date() });
    await attendance.save();
    return { success: true, msg: 'Checked in successfully!' };
}

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Connected to DB for WFH Test ---\n');

        // 1. Create a dummy test user
        const user = await User.create({
            name: 'Test WFH Employee',
            email: `wfh_test_${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log(`Created test user: ${user._id}`);

        const newYorkLat = 40.7128;
        const newYorkLng = -74.0060;

        // 2. Attempt check-in from New York without WFH approval
        console.log(`\nTEST 1: Checking in from New York (Without WFH Approval)...`);
        let result1 = await mockCheckIn(user._id, newYorkLat, newYorkLng);
        console.log(`Result: ${result1.success ? '✅ Success' : '❌ Failed'} - ${result1.msg}`);

        // 3. Create approved WFH request for today
        console.log(`\nCreating approved Work From Home HR Request for today...`);
        const hrRequest = await HRRequest.create({
            employee: user._id,
            type: 'Work From Home',
            description: 'Testing WFH bypass',
            status: 'Resolved',
            targetDate: new Date()
        });

        // 4. Attempt check-in from New York WITH WFH approval
        console.log(`\nTEST 2: Checking in from New York (WITH WFH Approval)...`);
        let result2 = await mockCheckIn(user._id, newYorkLat, newYorkLng);
        console.log(`Result: ${result2.success ? '✅ Success' : '❌ Failed'} - ${result2.msg}`);

        // 5. Cleanup
        console.log(`\nCleaning up test data...`);
        await User.findByIdAndDelete(user._id);
        await HRRequest.findByIdAndDelete(hrRequest._id);
        await Attendance.deleteMany({ employee: user._id });
        console.log('Cleanup complete.');

        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
}

runTest();
