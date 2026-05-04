const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const Attendance = require('../models/Attendance');

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
        res.json(attendance);
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
        const attendance = await Attendance.find({ employee: req.user.id }).sort({ date: -1 });
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

module.exports = router;
