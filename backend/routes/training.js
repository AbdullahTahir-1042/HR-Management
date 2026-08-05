const express = require('express');
const router = express.Router();
const Training = require('../models/Training');
const User = require('../models/User');
const { auth, isHR } = require('../middleware/auth');

// Utility to extract Google Drive fileId from URL (Legacy)
const extractFileId = (url) => {
    try {
        const match = url.match(/(?:file\/d\/|id=)([\w-]+)/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

// Utility to extract YouTube Video ID from URL
const extractYouTubeId = (url) => {
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
        return null;
    }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/training
// Add a new training video (HR ONLY)
// ─────────────────────────────────────────────────────────────────
router.post('/', auth, isHR, async (req, res) => {
    try {
        const { title, description, department, visibility, youtubeUrl, thumbnail, resourceType, documentUrl } = req.body;

        if (!title || !description) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const newTrainingData = {
            title,
            description,
            department: visibility === 'Everyone' ? null : department,
            visibility,
            resourceType: resourceType || 'Video',
            thumbnail,
            createdBy: req.user.id
        };

        if (newTrainingData.resourceType === 'Video') {
            if (!youtubeUrl) {
                return res.status(400).json({ msg: 'Please provide a YouTube URL for Video resources' });
            }
            const youtubeId = extractYouTubeId(youtubeUrl);
            if (!youtubeId) {
                return res.status(400).json({ msg: 'Invalid YouTube link provided. Could not extract Video ID.' });
            }
            newTrainingData.youtubeId = youtubeId;
        } else if (newTrainingData.resourceType === 'Document') {
            if (!documentUrl) {
                return res.status(400).json({ msg: 'Please provide a Document URL for Document resources' });
            }
            newTrainingData.documentUrl = documentUrl;
        }

        const newTraining = new Training(newTrainingData);

        const savedTraining = await newTraining.save();
        res.status(201).json(savedTraining);
    } catch (err) {
        console.error('POST /training error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/training/hr
// Get all training videos (HR ONLY)
// ─────────────────────────────────────────────────────────────────
router.get('/hr', auth, isHR, async (req, res) => {
    try {
        const videos = await Training.find()
            .populate('department', 'name')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        console.error('GET /training/hr error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/training
// Get authorized training videos for Employee
// ─────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('departmentId');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const query = {
            $or: [
                { visibility: 'Everyone' },
                { department: user.departmentId }
            ]
        };

        const videos = await Training.find(query)
            .populate('department', 'name')
            .sort({ createdAt: -1 });

        res.json(videos);
    } catch (err) {
        console.error('GET /training error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/training/:id
// Update training video (HR ONLY)
// ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, isHR, async (req, res) => {
    try {
        const { title, description, department, visibility, youtubeUrl, thumbnail, resourceType, documentUrl } = req.body;

        let training = await Training.findById(req.params.id);
        if (!training) {
            return res.status(404).json({ msg: 'Training resource not found' });
        }

        const updateData = {
            title,
            description,
            visibility,
            thumbnail
        };
        
        if (resourceType) {
            updateData.resourceType = resourceType;
        }

        if (visibility === 'Everyone') {
            updateData.department = null;
        } else if (department) {
            updateData.department = department;
        }

        if (updateData.resourceType === 'Video' || (!updateData.resourceType && training.resourceType === 'Video')) {
            if (youtubeUrl) {
                const youtubeId = extractYouTubeId(youtubeUrl);
                if (!youtubeId) {
                    return res.status(400).json({ msg: 'Invalid YouTube link provided.' });
                }
                updateData.youtubeId = youtubeId;
                updateData.documentUrl = ''; // Clear document URL if switching to video
            }
        } else if (updateData.resourceType === 'Document' || (!updateData.resourceType && training.resourceType === 'Document')) {
            if (documentUrl) {
                updateData.documentUrl = documentUrl;
                updateData.youtubeId = ''; // Clear youtubeId if switching to document
            }
        }

        training = await Training.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).populate('department', 'name');

        res.json(training);
    } catch (err) {
        console.error('PUT /training/:id error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/training/:id
// Delete training video (HR ONLY)
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', auth, isHR, async (req, res) => {
    try {
        const training = await Training.findById(req.params.id);
        if (!training) {
            return res.status(404).json({ msg: 'Training video not found' });
        }

        await Training.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Training video deleted successfully' });
    } catch (err) {
        console.error('DELETE /training/:id error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Training video not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
