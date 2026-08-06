const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const HRRequest = require('../models/HRRequest');
const Holiday = require('../models/Holiday');
const OfficeSchedule = require('../models/OfficeSchedule'); // ✅ NEW

const User = require('../models/User');
const Department = require('../models/Department'); // ✅ NEW
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');
const { getCheckInEmailTemplate } = require('../templates/checkInEmail');

// Helper function to calculate distance using Haversine formula
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// @route   POST api/attendance/check-in
// @desc    Employee Check-in
// @access  Private
router.post('/check-in', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const currentDate = new Date();
        
        // 0. Prevent check-in on Sundays (0 = Sunday)
        if (currentDate.getDay() === 0) {
            return res.status(403).json({ msg: 'Check-in is disabled on Sundays (Weekly Off).' });
        }

        const { latitude, longitude } = req.body;
        // 1. Check for WFH exemption first
        const todayDateStart = new Date(today);
        todayDateStart.setHours(0, 0, 0, 0);
        const todayDateEnd = new Date(today);
        todayDateEnd.setHours(23, 59, 59, 999);

        // 0.5 Prevent check-in on Holidays
        const activeHoliday = await Holiday.findOne({
            startDate: { $lte: todayDateEnd },
            endDate: { $gte: todayDateStart }
        });

        if (activeHoliday) {
            return res.status(403).json({ msg: `Check-in is disabled during holidays (${activeHoliday.name}).` });
        }

        // 0.7 Prevent check-in if user has an approved leave today
        const activeLeave = await LeaveRequest.findOne({
            employee: req.user.id,
            status: 'approved',
            startDate: { $lte: todayDateEnd },
            endDate: { $gte: todayDateStart }
        });

        if (activeLeave) {
            return res.status(403).json({ msg: `Check-in is disabled because you have an approved leave for today.` });
        }

        const approvedWFH = await HRRequest.findOne({
            employee: req.user.id,
            type: 'Work From Home',
            status: 'Resolved',
            targetDate: { $gte: todayDateStart, $lte: todayDateEnd }
        });

        // 2. Geofencing Check (Only if not WFH)
        if (!approvedWFH) {
            const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
            const officeLng = parseFloat(process.env.OFFICE_LONGITUDE);
            const maxRadius = parseFloat(process.env.GEOFENCE_RADIUS_METERS || 200);

            if (!officeLat || !officeLng) {
                return res.status(500).json({ msg: 'Server Configuration Error: Office location is not set.' });
            }

            if (!latitude || !longitude) {
                return res.status(400).json({ msg: 'Location data is required for check-in.' });
            }

            const distance = getDistanceFromLatLonInM(latitude, longitude, officeLat, officeLng);
            
            if (distance > maxRadius) {
                return res.status(403).json({ 
                    msg: `You are too far from the TDC office (The Dev Corporate) to check in. (Distance: ${Math.round(distance)}m, Allowed: ${maxRadius}m)` 
                });
            }
        } else {
            console.log(`✅ User ${req.user.id} has approved WFH for today. Bypassing geofence.`);
        }

        let attendance = await Attendance.findOne({ employee: req.user.id, date: today });
        if (attendance) {
            return res.status(400).json({ msg: 'Already checked in today' });
        }

        // --- NEW LATENESS LOGIC ---
        let checkInStatus = 'present';
        let expectedStartStr = '09:00';
        let expectedEndStr = '19:00';
        let appliedGracePeriod = 0;

        try {
            // Check if user has custom shift details
            const employeeUser = await User.findById(req.user.id).populate('departmentId');
            if (employeeUser && employeeUser.shiftDetails && employeeUser.shiftDetails.startTime && employeeUser.shiftDetails.endTime) {
                expectedStartStr = employeeUser.shiftDetails.startTime;
                expectedEndStr = employeeUser.shiftDetails.endTime;
                appliedGracePeriod = employeeUser.shiftDetails.gracePeriod || 0;
            } else if (employeeUser && employeeUser.departmentId && employeeUser.departmentId.shiftDetails && employeeUser.departmentId.shiftDetails.startTime && employeeUser.departmentId.shiftDetails.endTime) {
                // Fallback to Department Shift
                expectedStartStr = employeeUser.departmentId.shiftDetails.startTime;
                expectedEndStr = employeeUser.departmentId.shiftDetails.endTime;
                appliedGracePeriod = employeeUser.departmentId.shiftDetails.gracePeriod || 0;
            } else {
                // Fallback to global Office Schedule
                let schedule = await OfficeSchedule.findOne({ date: today, isDefault: false });
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
            const expectedTime = new Date();
            expectedTime.setHours(startHour, startMin + appliedGracePeriod, 0, 0);

            if (new Date() > expectedTime) {
                checkInStatus = 'late';
            }
        } catch (scheduleErr) {
            console.error("Error determining lateness from schedule/shift:", scheduleErr);
        }
        // -------------------------

        attendance = new Attendance({
            employee: req.user.id,
            date: today,
            checkIn: new Date(),
            status: checkInStatus,
            expectedCheckIn: expectedStartStr,
            expectedCheckOut: expectedEndStr
        });
        await attendance.save();
        console.log("✅ Attendance saved");

        // Notify HR Admins of check-in
        const hrAdmins = await User.find({ role: { $in: ['hr', 'admin'] } });
        const employeeName = req.user.name || (await User.findById(req.user.id))?.name || 'An employee';
        for (const hr of hrAdmins) {
            await Notification.create({
                recipient: hr._id,
                title: 'Employee Checked In',
                message: `${employeeName} has checked in.`,
                type: 'system'
            });
        }

        // Send response immediately so the user isn't kept waiting
        res.json(attendance);

        // ── Send Check-In Email Notification Asynchronously afterwards ──
        setTimeout(async () => {
            try {
                const employee = await User.findById(req.user.id);
                console.log(`[CheckIn Email] Processing for user ID: ${req.user.id}, Email: ${employee?.email || 'N/A'}`);

                if (!employee || !employee.email) {
                    console.warn(`[CheckIn Email] Skipped: Employee record or email address missing for ID ${req.user.id}`);
                    return;
                }

                const prefs = employee.notificationPreferences;
                const isEmailEnabled = (!prefs || (prefs.all !== false && prefs.attendance !== false));

                if (!isEmailEnabled) {
                    console.log(`[CheckIn Email] Skipped: User ${employee.email} has disabled attendance email notifications.`);
                    return;
                }

                const checkInDate = new Date(attendance.checkIn).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
                });
                const checkInTime = new Date(attendance.checkIn).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', hour12: true
                });

                const template = getCheckInEmailTemplate({
                    name: employee.name,
                    date: checkInDate,
                    time: checkInTime,
                    department: employee.department || 'N/A'
                });

                console.log(`[CheckIn Email] Dispatching check-in email to ${employee.email}...`);

                const result = await sendEmail({
                    to: employee.email,
                    subject: template.subject,
                    html: template.html
                });

                if (result && result.success) {
                    console.log(`✅ [CheckIn Email] Successfully sent to ${employee.email} (Message ID: ${result.data?.id})`);
                } else {
                    console.error(`❌ [CheckIn Email] Failed to send to ${employee.email}:`, result?.error || 'Unknown error');
                }
            } catch (emailErr) {
                console.error("❌ [CheckIn Email Exception]:", emailErr);
            }
        }, 0);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/attendance/check-out
// @desc    Employee Check-out
// @access  Private
router.post('/check-out', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
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
});

// @route   GET api/attendance/status
// @desc    Get today's attendance status
// @access  Private
router.get('/status', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const attendance = await Attendance.findOne({ employee: req.user.id, date: today });
        res.json(attendance);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/my-history
// @desc    Get employee's attendance history for the current month
// @access  Private
router.get('/my-history', auth, async (req, res) => {
    try {
        const currentMonthPrefix = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
        const attendance = await Attendance.find({ 
            employee: req.user.id, 
            date: { $regex: `^${currentMonthPrefix}` } 
        }).sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/all
// @desc    Get all attendance records (HR only)
// @access  Private (HR)
router.get('/all', [auth, isHR], async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate('employee', ['name', 'email'])
            .sort({ date: -1 });
        res.json(attendance);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/report
// @desc    Get attendance or leave reports with filters (HR only)
// @access  Private (HR)
router.get('/report', [auth, isHR], async (req, res) => {
    try {
        // We added 'type' here so the frontend can choose 'attendance' or 'leave'
        const { type, startDate, endDate, employeeId } = req.query;

        let filter = {};
        if (employeeId) {
            filter.employee = employeeId;
        }

        // CASE 1: If HR wants a Leave Report
        if (type === 'leave') {
            if (startDate && endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.startDate = { $lte: end };
                filter.endDate = { $gte: new Date(startDate) };
            }
            const leaveRecords = await LeaveRequest.find(filter)
                .populate('employee', ['name', 'email', 'department'])
                .populate('leaveType')
                .sort({ createdAt: -1 });
            return res.json(leaveRecords);
        }

        // CASE 2: Default to Attendance Report if type isn't 'leave'
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            filter.date = { $gte: startDate };
        } else if (endDate) {
            filter.date = { $lte: endDate };
        }

        const attendanceRecords = await Attendance.find(filter)
            .populate('employee', ['name', 'email', 'department'])
            .sort({ date: -1 });

        res.json(attendanceRecords);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;