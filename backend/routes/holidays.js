const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
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