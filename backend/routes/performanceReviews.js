const express = require('express');
const router = express.Router();
const PerformanceReview = require('../models/PerformanceReview');
const User = require('../models/User');
const { auth, isHR, isTeamLead } = require('../middleware/auth');

// Helper to compare dates ignoring times timezone-insensitively
const getStartOfDay = (d) => {
    if (typeof d === 'string' && d.includes('-')) {
        const parts = d.split('-');
        if (parts.length === 3) {
            return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
        }
    }
    const date = new Date(d);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// ─────────────────────────────────────────────
// GET /api/performance-reviews/summary/:employeeId
// Get aggregated performance and penalties summary
// ─────────────────────────────────────────────
router.get('/summary/:employeeId', auth, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const employee = await User.findById(employeeId);
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Permissions: HR, Admin, self, or Team Lead of same department
        const reqUser = await User.findById(req.user.id);
        if (reqUser.role !== 'hr' && reqUser.role !== 'admin' && req.user.id !== employeeId) {
            if (!reqUser.isTeamLead || reqUser.departmentId?.toString() !== employee.departmentId?.toString()) {
                return res.status(403).json({ msg: 'Access denied' });
            }
        }

        const reviews = await PerformanceReview.find({ employee: employeeId });
        let hasReviews = reviews.length > 0;
        
        let sum = hasReviews ? reviews.reduce((acc, rev) => acc + rev.overallRating, 0) : 5.0;
        let count = hasReviews ? reviews.length : 1;
        let averageBaseRating = sum / count;

        const MistakeReport = require('../models/MistakeReport');
        const mistakeReports = await MistakeReport.find({ agentId: employeeId });
        const totalComplaints = mistakeReports.length;

        // Sum mistake severities
        let totalPenalty = 0;
        mistakeReports.forEach(report => {
            totalPenalty += (report.severityPoints || 0);
        });

        // Penalties deduct from the TOTAL sum of points across all reviews,
        // so acquiring more good reviews will dilute the penalty and raise the average.
        let adjustedSum = sum - totalPenalty;
        if (adjustedSum < 0) adjustedSum = 0;

        let adjustedRating = adjustedSum / count;
        if (adjustedRating > 5.0) adjustedRating = 5.0;

        res.json({
            hasReviews,
            averageBaseRating: averageBaseRating.toFixed(1),
            totalComplaints,
            adjustedRating: adjustedRating.toFixed(1),
            complaints: mistakeReports
        });

    } catch (err) {
        console.error('Error fetching performance summary:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/performance-reviews/:employeeId
// Get all reviews for an employee
// ─────────────────────────────────────────────
router.get('/:employeeId', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const emp = await User.findById(req.params.employeeId);
        if (!emp) return res.status(404).json({ msg: 'Employee not found' });
        
        const isSelf = req.user.id === req.params.employeeId;
        const reqUser = await User.findById(req.user.id);
        if (!reqUser) return res.status(401).json({ msg: 'User not found' });
        
        const isHR = reqUser.role === 'hr' || reqUser.role === 'admin';
        
        let isLead = false;
        if (!isSelf && !isHR) {
            if (reqUser.departmentId?.toString() === emp.departmentId?.toString() && reqUser.isTeamLead) {
                isLead = true;
            }
        }
        
        if (!isSelf && !isHR && !isLead) {
            return res.status(403).json({ msg: 'Not authorized to view these reviews' });
        }

        const reviews = await PerformanceReview.find({ employee: req.params.employeeId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ reviewDate: -1 });
        console.log(`Fetched ${reviews.length} reviews for employee ${req.params.employeeId}`);
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching performance reviews:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/performance-reviews
// Create a new performance review (HR only)
// ─────────────────────────────────────────────
router.post('/', [auth, isTeamLead], async (req, res) => {
    try {
        const {
            employee, reviewDate,
            overallRating, comments, strengths, areasForImprovement,
            goals, nextReviewDate
        } = req.body;

        // Fetch logged-in user name from database
        const tlUser = await User.findById(req.user.id).select('name departmentId');
        if (!tlUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const resolvedReviewer = tlUser.name;

        // ── Validation ──────────────────────────────────────────────────
        if (!employee) {
            return res.status(400).json({ msg: 'Employee ID is required' });
        }
        const emp = await User.findById(employee);
        if (!emp) {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        
        if (emp.departmentId?.toString() !== tlUser.departmentId?.toString()) {
            return res.status(403).json({ msg: 'You can only review members of your own team' });
        }
        if (!reviewDate || isNaN(new Date(reviewDate).getTime())) {
            return res.status(400).json({ msg: 'Valid review date is required' });
        }

        // Validate date is not in the past
        const targetDate = getStartOfDay(reviewDate);
        const todayDate = getStartOfDay(new Date());
        if (targetDate < todayDate) {
            return res.status(400).json({ msg: 'Review date cannot be a past date' });
        }

        const rating = Number(overallRating);
        if (!overallRating || isNaN(rating) || rating < 0 || rating > 5 || rating % 0.5 !== 0) {
            return res.status(400).json({ msg: 'Overall rating must be between 0 and 5, in multiples of 0.5' });
        }
        if (!comments || !comments.trim()) {
            return res.status(400).json({ msg: 'Comments are required' });
        }
        if (nextReviewDate && isNaN(new Date(nextReviewDate).getTime())) {
            return res.status(400).json({ msg: 'Next review date must be a valid date' });
        }

        const review = new PerformanceReview({
            employee,
            reviewDate: targetDate,
            reviewPeriod: '',
            reviewer: resolvedReviewer,
            overallRating: rating,
            comments: comments.trim(),
            strengths: strengths || '',
            areasForImprovement: areasForImprovement || '',
            goals: goals || '',
            nextReviewDate: nextReviewDate ? getStartOfDay(nextReviewDate) : null,
            createdBy: req.user.id
        });

        await review.save();

        const populated = await PerformanceReview.findById(review._id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating performance review:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/performance-reviews/:id
// Update an existing review (HR only)
// ─────────────────────────────────────────────
router.put('/:id', [auth, isTeamLead], async (req, res) => {
    try {
        const review = await PerformanceReview.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ msg: 'Performance review not found' });
        }

        const {
            reviewDate, overallRating,
            comments, strengths, areasForImprovement, goals, nextReviewDate
        } = req.body;

        // Fetch logged-in Team Lead name from database
        const tlUser = await User.findById(req.user.id).select('name departmentId');
        if (!tlUser) {
            return res.status(404).json({ msg: 'Team Lead user not found' });
        }
        review.reviewer = tlUser.name;
        review.reviewPeriod = '';

        if (reviewDate !== undefined) {
            if (isNaN(new Date(reviewDate).getTime())) {
                return res.status(400).json({ msg: 'Valid review date is required' });
            }
            const targetDate = getStartOfDay(reviewDate);
            const todayDate = getStartOfDay(new Date());
            if (targetDate < todayDate) {
                return res.status(400).json({ msg: 'Review date cannot be a past date' });
            }
            review.reviewDate = targetDate;
        }
        if (overallRating !== undefined) {
            const rating = Number(overallRating);
            if (isNaN(rating) || rating < 0 || rating > 5 || rating % 0.5 !== 0) {
                return res.status(400).json({ msg: 'Overall rating must be between 0 and 5, in multiples of 0.5' });
            }
            review.overallRating = rating;
        }
        if (comments !== undefined) {
            if (!comments.trim()) return res.status(400).json({ msg: 'Comments are required' });
            review.comments = comments.trim();
        }
        if (strengths !== undefined) review.strengths = strengths;
        if (areasForImprovement !== undefined) review.areasForImprovement = areasForImprovement;
        if (goals !== undefined) review.goals = goals;
        if (nextReviewDate !== undefined) {
            if (nextReviewDate && isNaN(new Date(nextReviewDate).getTime())) {
                return res.status(400).json({ msg: 'Next review date must be a valid date' });
            }
            review.nextReviewDate = nextReviewDate ? getStartOfDay(nextReviewDate) : null;
        }

        review.updatedBy = req.user.id;
        await review.save();

        const populated = await PerformanceReview.findById(review._id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.json(populated);
    } catch (err) {
        console.error('Error updating performance review:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/performance-reviews/:id
// Delete a review (HR only)
// ─────────────────────────────────────────────
router.delete('/:id', [auth, isTeamLead], async (req, res) => {
    try {
        const review = await PerformanceReview.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ msg: 'Performance review not found' });
        }

        await PerformanceReview.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Performance review deleted successfully' });
    } catch (err) {
        console.error('Error deleting performance review:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
