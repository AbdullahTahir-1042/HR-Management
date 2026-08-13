const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, isHR } = require('../middleware/auth');

// GET all holidays
router.get('/', async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ startDate: 1 });
        res.json(holidays);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST add holiday
router.post('/', [auth, isHR], async (req, res) => {
    try {
        const { name, startDate, endDate, description, type } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ msg: 'Holiday name is required' });
        }
        if (!startDate) {
            return res.status(400).json({ msg: 'Start date is required' });
        }
        if (!endDate) {
            return res.status(400).json({ msg: 'End date is required' });
        }
        if (endDate < startDate) {
            return res.status(400).json({ msg: 'End date cannot be before start date' });
        }

        const holiday = new Holiday({ name, startDate, endDate, description, type });
        await holiday.save();

        // Notify all active employees
        const activeUsers = await User.find({ status: { $ne: 'Inactive' } });
        const notifications = activeUsers.map(user => ({
            recipient: user._id,
            title: 'New Holiday Added',
            message: `A new ${type} holiday "${name}" has been scheduled from ${startDate} to ${endDate}.`,
            type: 'system'
        }));
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json(holiday);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT edit holiday
router.put('/:id', [auth, isHR], async (req, res) => {
    try {
        const { name, startDate, endDate, description, type } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ msg: 'Holiday name is required' });
        }
        if (!startDate) {
            return res.status(400).json({ msg: 'Start date is required' });
        }
        if (!endDate) {
            return res.status(400).json({ msg: 'End date is required' });
        }
        if (endDate < startDate) {
            return res.status(400).json({ msg: 'End date cannot be before start date' });
        }

        const holiday = await Holiday.findByIdAndUpdate(
            req.params.id,
            { name, startDate, endDate, description, type },
            { new: true }
        );

        if (!holiday) {
            return res.status(404).json({ msg: 'Holiday not found' });
        }

        res.json(holiday);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE holiday
router.delete('/:id', [auth, isHR], async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);

        if (!holiday) {
            return res.status(404).json({ msg: 'Holiday not found' });
        }

        res.json({ msg: 'Holiday deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;