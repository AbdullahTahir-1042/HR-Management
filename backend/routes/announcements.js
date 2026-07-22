const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcements');
const User = require('../models/User'); // Import your User model
const { auth, isHR } = require('../middleware/auth');
const { messaging } = require('../config/firebaseAdmin'); // Import Firebase Admin

let clients = [];

// GET SSE stream of announcements
router.get('/stream', auth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(c => c !== res);
    });
});

// GET all announcements — any logged-in user (HR or employee) can view
router.get('/', auth, async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ msg: 'Server error fetching announcements' });
    }
});

// POST create a new announcement — HR only
router.post('/', auth, isHR, async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !title.trim() || !message || !message.trim()) {
            return res.status(400).json({ msg: 'Title and message are required' });
        }
        
        // 1. Save to MongoDB
        const announcement = await Announcement.create({
            title: title.trim(),
            message: message.trim(),
            createdBy: req.user.id,
        });
        const populated = await announcement.populate('createdBy', 'name');

        // 2. --- FIREBASE PUSH NOTIFICATION LOGIC ---
        try {
            // Find all users who have an FCM token saved
            const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
            
            // Map out the tokens
            const rawTokens = users.map(user => user.fcmToken);
            
            // CRITICAL FIX: Filter out duplicates to stop double-notifications
            const uniqueTokens = [...new Set(rawTokens)];

            if (uniqueTokens.length > 0) {
                // We provide both notification and data fields for reliable background delivery
                const messagePayload = {
                    tokens: uniqueTokens, // Use the filtered array here!
                    notification: {
                        title: `HR Announcement: ${title.trim()}`,
                        body: message.trim(),
                    },
                    data: {
                        title: title.trim(),
                        body: message.trim()
                    }
                };
                
                // Using sendEachForMulticast for modern Firebase compatibility
                const response = await messaging.sendEachForMulticast(messagePayload);
                console.log(`${response.successCount} live notifications delivered.`);
                
                if (response.failureCount > 0) {
                    console.error(`${response.failureCount} notifications failed.`);
                }
            }
        } catch (firebaseErr) {
            console.error('Firebase Broadcast Error:', firebaseErr);
            // We catch this so a Firebase failure doesn't crash the MongoDB save response
        }
        // -------------------------------------------

        // Send SSE notification to all connected clients instantly
        clients.forEach(client => {
            try {
                client.write(`data: ${JSON.stringify(populated)}\n\n`);
            } catch (err) {
                console.error('Error writing to client stream:', err);
            }
        });

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(500).json({ msg: err.message || 'Server error creating announcement' });
    }
});

// PUT mark an announcement as read — any logged-in user
router.put('/:id/read', auth, async (req, res) => {
    try {
        const updated = await Announcement.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { readBy: req.user.id } },
            { new: true }
        ).populate('createdBy', 'name');
        res.json(updated);
    } catch (err) {
        console.error('Error marking announcement as read:', err);
        res.status(500).json({ msg: 'Server error marking as read' });
    }
});

// PUT edit an announcement — HR only
router.put('/:id', auth, isHR, async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!title || !title.trim() || !message || !message.trim()) {
            return res.status(400).json({ msg: 'Title and message are required' });
        }
        const updated = await Announcement.findByIdAndUpdate(
            req.params.id,
            { title: title.trim(), message: message.trim() },
            { new: true }
        ).populate('createdBy', 'name');
        if (!updated) return res.status(404).json({ msg: 'Announcement not found' });
        res.json(updated);
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(500).json({ msg: err.message || 'Server error updating announcement' });
    }
});

// DELETE an announcement — HR only
router.delete('/:id', auth, isHR, async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Announcement deleted' });
    } catch (err) {
        console.error('Error deleting announcement:', err);
        res.status(500).json({ msg: 'Server error deleting announcement' });
    }
});

module.exports = router;