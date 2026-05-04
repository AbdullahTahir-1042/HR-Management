const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');

// @route   POST api/leaves/apply
// @desc    Employee Apply for Leave
// @access  Private
router.post('/apply', auth, async (req, res) => {
    const { startDate, endDate, reason } = req.body;

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0,0,0,0); // Reset time for accurate day comparison

        // Calculate duration in days
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate days from today to start date
        const noticePeriod = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

        if (duration === 1 && noticePeriod < 4) {
            return res.status(400).json({ msg: 'One-day leave must be requested at least 4 days in advance.' });
        }
        if (duration > 1 && noticePeriod < 8) {
            return res.status(400).json({ msg: 'Multi-day leave must be requested at least 8 days in advance.' });
        }

        const leave = new LeaveRequest({
            employee: req.user.id,
            startDate,
            endDate,
            reason
        });

        await leave.save();
        res.json(leave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/my-leaves
// @desc    Get employee's leave requests
// @access  Private
router.get('/my-leaves', auth, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ employee: req.user.id })
            .populate('employee', ['name', 'email'])
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/all
// @desc    Get all leave requests (HR only)
// @access  Private (HR)
router.get('/all', [auth, isHR], async (req, res) => {
    try {
        const leaves = await LeaveRequest.find().populate('employee', ['name', 'email']).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/leaves/:id/status
// @desc    Update leave status (HR only)
// @access  Private (HR)
router.put('/:id/status', [auth, isHR], async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'

    try {
        let leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

        leave.status = status;
        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
