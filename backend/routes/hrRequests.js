const express = require('express');
const router = express.Router();
const HRRequest = require('../models/HRRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// @route   POST api/hr-requests
// @desc    Submit a new HR Request
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { type, description, targetDate } = req.body;

        if (!type) {
            return res.status(400).json({ msg: 'Request type is required' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ msg: 'Description is required' });
        }

        const newRequest = new HRRequest({
            employee: req.user.id,
            type,
            description,
            targetDate: targetDate ? new Date(targetDate) : undefined
        });

        await newRequest.save();

        // Notify HR users
        try {
            const hrUsers = await User.find({ role: { $regex: /^hr$/i } });
            const employeeUser = await User.findById(req.user.id);
            for (const hr of hrUsers) {
                await Notification.create({
                    recipient: hr._id,
                    type: 'HRRequest',
                    title: 'New HR Request Submitted',
                    message: `${employeeUser?.name || 'An employee'} submitted a ${type} request.`,
                    relatedId: newRequest._id
                });
            }
        } catch (nErr) {
            console.error('Error creating HR notification for request:', nErr);
        }

        res.status(201).json(newRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── Employee: Get own requests ─────────────────────────────────────────────────
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await HRRequest.find({ employee: req.user.id })
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── HR Admin: Get all requests ─────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const requests = await HRRequest.find()
            .populate('employee', 'name email department')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── HR Admin: Update request status and note ───────────────────────────────────
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, hrNote } = req.body;

        const request = await HRRequest.findByIdAndUpdate(
            req.params.id,
            { status, hrNote },
            { new: true }
        ).populate('employee', 'name email department');

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Notify Employee
        try {
            await Notification.create({
                recipient: request.employee._id || request.employee,
                type: 'HRRequest',
                title: `HR Request ${status}`,
                message: `Your ${request.type} request has been marked as ${status}.`,
                relatedId: request._id
            });
        } catch (nErr) {
            console.error('Error creating employee notification for HR request:', nErr);
        }

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;