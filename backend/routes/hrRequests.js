const express = require('express');
const router = express.Router();
const HRRequest = require('../models/HRRequest');
const { auth } = require('../middleware/auth');

// ── Employee: Submit a new HR request ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
    try {
        const { type, description } = req.body;

        if (!type) {
            return res.status(400).json({ msg: 'Request type is required' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ msg: 'Description is required' });
        }

        const request = new HRRequest({
            employee: req.user.id,
            type,
            description: description.trim()
        });

        await request.save();
        res.status(201).json(request);
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

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;