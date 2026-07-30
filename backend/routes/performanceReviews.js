const express = require('express');
const router = express.Router();
const PerformanceReview = require('../models/PerformanceReview');
const User = require('../models/User');
const { auth, isHR } = require('../middleware/auth');

// ─────────────────────────────────────────────
// GET /api/performance-reviews/:employeeId
// Get all reviews for an employee
// ─────────────────────────────────────────────
router.get('/:employeeId', [auth, isHR], async (req, res) => {
    try {
        const reviews = await PerformanceReview.find({ employee: req.params.employeeId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ reviewDate: -1 });
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
router.post('/', [auth, isHR], async (req, res) => {
    try {
        const {
            employee, reviewDate, reviewPeriod, reviewer,
            overallRating, comments, strengths, areasForImprovement,
            goals, nextReviewDate
        } = req.body;

        // ── Validation ──────────────────────────────────────────────────
        if (!employee) {
            return res.status(400).json({ msg: 'Employee ID is required' });
        }
        const emp = await User.findById(employee);
        if (!emp) {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        if (!reviewDate || isNaN(new Date(reviewDate).getTime())) {
            return res.status(400).json({ msg: 'Valid review date is required' });
        }
        if (!reviewPeriod || !reviewPeriod.trim()) {
            return res.status(400).json({ msg: 'Review period is required (e.g. "Jan 2026 – Jun 2026")' });
        }
        if (!reviewer || !reviewer.trim()) {
            return res.status(400).json({ msg: 'Reviewer name is required' });
        }
        const rating = Number(overallRating);
        if (!overallRating || isNaN(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({ msg: 'Overall rating must be an integer between 1 and 5' });
        }
        if (!comments || !comments.trim()) {
            return res.status(400).json({ msg: 'Comments are required' });
        }
        if (nextReviewDate && isNaN(new Date(nextReviewDate).getTime())) {
            return res.status(400).json({ msg: 'Next review date must be a valid date' });
        }

        const review = new PerformanceReview({
            employee,
            reviewDate: new Date(reviewDate),
            reviewPeriod: reviewPeriod.trim(),
            reviewer: reviewer.trim(),
            overallRating: rating,
            comments: comments.trim(),
            strengths: strengths || '',
            areasForImprovement: areasForImprovement || '',
            goals: goals || '',
            nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
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
router.put('/:id', [auth, isHR], async (req, res) => {
    try {
        const review = await PerformanceReview.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ msg: 'Performance review not found' });
        }

        const {
            reviewDate, reviewPeriod, reviewer, overallRating,
            comments, strengths, areasForImprovement, goals, nextReviewDate
        } = req.body;

        if (reviewDate !== undefined) {
            if (isNaN(new Date(reviewDate).getTime())) {
                return res.status(400).json({ msg: 'Valid review date is required' });
            }
            review.reviewDate = new Date(reviewDate);
        }
        if (reviewPeriod !== undefined) {
            if (!reviewPeriod.trim()) return res.status(400).json({ msg: 'Review period is required' });
            review.reviewPeriod = reviewPeriod.trim();
        }
        if (reviewer !== undefined) {
            if (!reviewer.trim()) return res.status(400).json({ msg: 'Reviewer name is required' });
            review.reviewer = reviewer.trim();
        }
        if (overallRating !== undefined) {
            const rating = Number(overallRating);
            if (isNaN(rating) || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
                return res.status(400).json({ msg: 'Overall rating must be an integer between 1 and 5' });
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
            review.nextReviewDate = nextReviewDate ? new Date(nextReviewDate) : null;
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
router.delete('/:id', [auth, isHR], async (req, res) => {
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
