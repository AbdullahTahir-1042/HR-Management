const express = require('express');
const router = express.Router();
const MistakeReport = require('../models/MistakeReport');
const User = require('../models/User');
const { auth, isTeamLead } = require('../middleware/auth');

// ─────────────────────────────────────────────
// POST /api/mistake-reports
// Team Lead submits a new mistake report
// ─────────────────────────────────────────────
router.post('/', auth, isTeamLead, async (req, res) => {
    try {
        const {
            agentName, agentId,
            dateOfMistake, mistakeDescription, learning, improvement, severityPoints
        } = req.body;

        const submitter = await User.findById(req.user.id).select('departmentId');

        let parsedSeverity = severityPoints ? Number(severityPoints) : 0;
        if (isNaN(parsedSeverity) || parsedSeverity < 0 || parsedSeverity > 5 || parsedSeverity % 0.5 !== 0) {
            return res.status(400).json({ msg: 'Severity points must be between 0 and 5, in multiples of 0.5' });
        }

        const report = new MistakeReport({
            agentName,
            agentId: agentId || null,
            dateOfMistake,
            mistakeDescription,
            severityPoints: parsedSeverity,
            learning,
            improvement,
            teamName: submitter?.departmentId?.toString() || '',
            submittedBy: req.user.id
        });

        await report.save();
        res.status(201).json({ msg: 'Mistake report submitted successfully', report });

    } catch (err) {
        console.error('Error saving mistake report:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/mistake-reports
// HR Admin gets ALL reports
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const reports = await MistakeReport.find()
            .populate({
                path: 'submittedBy',
                select: 'name email departmentId',
                populate: { path: 'departmentId', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/mistake-reports/my-team
// Team Lead gets reports submitted by users in their department
// ─────────────────────────────────────────────
router.get('/my-team', auth, isTeamLead, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser || !currentUser.departmentId) {
            return res.json([]);
        }

        // Find all users in the same department
        const usersInDept = await User.find({ departmentId: currentUser.departmentId }).select('_id');
        const userIds = usersInDept.map(u => u._id);

        // Find reports submitted by users belonging to this department
        const reports = await MistakeReport.find({ submittedBy: { $in: userIds } })
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/mistake-reports/agent/:agentName
// Employee sees their OWN mistakes by name
// ─────────────────────────────────────────────
router.get('/agent/:agentName', auth, async (req, res) => {
    try {
        const reports = await MistakeReport.find({
            agentName: { $regex: new RegExp(`^${req.params.agentName}$`, 'i') }
        }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/mistake-reports/:id/status
// HR Admin marks report as resolved (HR only)
// ─────────────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'resolved'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const reqUser = await User.findById(req.user.id);
        if (!reqUser || reqUser.role !== 'hr') {
            return res.status(403).json({ msg: 'Access denied: HR only' });
        }

        const report = await MistakeReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ msg: 'Mistake report not found' });
        }

        report.status = status;
        await report.save();

        res.json({ msg: `Report status updated to ${status}`, report });
    } catch (err) {
        console.error('Error updating report status:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   DELETE api/mistake-reports/:id
// @desc    Delete a mistake report (Undo)
// @access  Private (HR or Submitter Team Lead)
router.delete('/:id', auth, async (req, res) => {
    try {
        const report = await MistakeReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ msg: 'Mistake report not found' });
        }

        const user = await User.findById(req.user.id);
        const isHR = user && user.role === 'hr';
        const isSubmitter = report.submittedBy.toString() === req.user.id;

        if (!isHR && !isSubmitter) {
            return res.status(403).json({ msg: 'Not authorized to delete this report' });
        }

        await MistakeReport.deleteOne({ _id: req.params.id });
        res.json({ msg: 'Mistake report deleted successfully' });
    } catch (err) {
        console.error('Error deleting report:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;