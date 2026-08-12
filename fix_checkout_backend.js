const fs = require('fs');
let content = fs.readFileSync('backend/routes/attendance.js', 'utf8');

const checkoutReplacement = `router.post('/check-out', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const currentDate = new Date();
        const { latitude, longitude } = req.body;

        const todayDateStart = new Date(today);
        todayDateStart.setHours(0, 0, 0, 0);
        const todayDateEnd = new Date(today);
        todayDateEnd.setHours(23, 59, 59, 999);

        // Geofencing Check
        const approvedWFH = await HRRequest.findOne({
            employee: req.user.id,
            type: 'Work From Home',
            status: 'Resolved',
            targetDate: { $gte: todayDateStart, $lte: todayDateEnd }
        });

        if (!approvedWFH) {
            const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
            const officeLng = parseFloat(process.env.OFFICE_LONGITUDE);
            const maxRadius = parseFloat(process.env.GEOFENCE_RADIUS_METERS || 200);

            if (!officeLat || !officeLng) {
                return res.status(500).json({ msg: 'Server Configuration Error: Office location is not set.' });
            }

            if (!latitude || !longitude) {
                return res.status(400).json({ msg: 'Location data is required for check-out.' });
            }

            const distance = getDistanceFromLatLonInM(latitude, longitude, officeLat, officeLng);

            if (distance > maxRadius) {
                return res.status(403).json({
                    msg: \`You are too far from the TDC office (The Dev Corporate) to check out. (Distance: \${Math.round(distance)}m, Allowed: \${maxRadius}m)\`
                });
            }
        } else {
            console.log(\`✅ User \${req.user.id} has approved WFH for today. Bypassing geofence for check-out.\`);
        }

        let attendance = await Attendance.findOne({ employee: req.user.id, date: today });
        if (!attendance) {
            return res.status(400).json({ msg: 'Must check in first' });
        }
        if (attendance.checkOut) {
            return res.status(400).json({ msg: 'Already checked out today' });
        }
        attendance.checkOut = new Date();
        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});`;

// We use a robust regex to replace the check-out route
// From "router.post('/check-out', auth, async (req, res) => {" up to "});\n\n// @route   GET api/attendance/status"
const regex = /router\.post\('\/check-out', auth, async \(req, res\) => \{[\s\S]*?\}\);\n/g;
if (regex.test(content)) {
    content = content.replace(regex, checkoutReplacement + '\n');
    fs.writeFileSync('backend/routes/attendance.js', content);
    console.log('Fixed backend checkout logic');
} else {
    console.log('Regex did not match check-out route!');
}
