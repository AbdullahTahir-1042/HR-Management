const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { getCheckInEmailTemplate } = require('../templates/checkInEmail');

// @route   POST api/attendance/check-in
// @desc    Employee Check-in
// @access  Private
router.post('/check-in', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        let attendance = await Attendance.findOne({ employee: req.user.id, date: today });
        if (attendance) {
            return res.status(400).json({ msg: 'Already checked in today' });
        }
        attendance = new Attendance({
            employee: req.user.id,
            date: today,
            checkIn: new Date()
        });
        await attendance.save();
        console.log("✅ Attendance saved");

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
// @desc    Get employee's attendance history
// @access  Private
router.get('/my-history', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await Attendance.find({ employee: req.user.id, date: today }).sort({ date: -1 });
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