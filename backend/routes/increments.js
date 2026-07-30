const express = require('express');
const router = express.Router();
const Increment = require('../models/Increment');
const User = require('../models/User');
const { auth, isHR } = require('../middleware/auth');

const VALID_RANKS = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];
const VALID_STATUSES = ['Pending', 'Approved', 'Rejected'];

// ─────────────────────────────────────────────
// GET /api/increments/:employeeId
// Get all increment records for an employee
// ─────────────────────────────────────────────
router.get('/:employeeId', [auth, isHR], async (req, res) => {
    try {
        const increments = await Increment.find({ employee: req.params.employeeId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ incrementDate: -1 });
        res.json(increments);
    } catch (err) {
        console.error('Error fetching increments:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/increments
// Create a new increment record (HR only)
// ─────────────────────────────────────────────
router.post('/', [auth, isHR], async (req, res) => {
    try {
        const {
            employee, incrementDate, previousSalary, incrementAmount,
            promotionRank, reason, approvedBy, notes, status
        } = req.body;

        // ── Validation ──────────────────────────────────────────────────
        if (!employee) {
            return res.status(400).json({ msg: 'Employee ID is required' });
        }
        const emp = await User.findById(employee);
        if (!emp) {
            return res.status(404).json({ msg: 'Employee not found' });
        }
        if (!incrementDate || isNaN(new Date(incrementDate).getTime())) {
            return res.status(400).json({ msg: 'Valid increment date is required' });
        }
        if (previousSalary === undefined || previousSalary === null || isNaN(previousSalary) || Number(previousSalary) < 0) {
            return res.status(400).json({ msg: 'Previous salary must be a non-negative number' });
        }
        if (incrementAmount === undefined || incrementAmount === null || isNaN(incrementAmount) || Number(incrementAmount) < 0) {
            return res.status(400).json({ msg: 'Increment amount must be a non-negative number' });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ msg: 'Reason for increment is required' });
        }
        if (!approvedBy || !approvedBy.trim()) {
            return res.status(400).json({ msg: 'Approved By field is required' });
        }
        if (promotionRank && !VALID_RANKS.includes(promotionRank)) {
            return res.status(400).json({ msg: 'Invalid promotion rank value' });
        }
        if (status && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ msg: 'Status must be Pending, Approved, or Rejected' });
        }

        // ── Auto-calculations ───────────────────────────────────────────
        const prevSal = Number(previousSalary);
        const incAmt = Number(incrementAmount);
        const newSalary = prevSal + incAmt;
        const incrementPercentage = prevSal > 0 ? parseFloat(((incAmt / prevSal) * 100).toFixed(2)) : 0;

        const increment = new Increment({
            employee,
            incrementDate: new Date(incrementDate),
            previousSalary: prevSal,
            incrementAmount: incAmt,
            newSalary,
            incrementPercentage,
            promotionRank: promotionRank || null,
            reason: reason.trim(),
            approvedBy: approvedBy.trim(),
            notes: notes || '',
            status: status || 'Pending',
            createdBy: req.user.id
        });

        await increment.save();

        // If status is Approved, auto-update employee salary & rank
        if (increment.status === 'Approved') {
            emp.salary = newSalary;
            if (promotionRank && VALID_RANKS.includes(promotionRank)) {
                emp.promotionRank = promotionRank;
            }
            await emp.save();
        }

        const populated = await Increment.findById(increment._id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating increment:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/increments/:id
// Update an existing increment record (HR only)
// ─────────────────────────────────────────────
router.put('/:id', [auth, isHR], async (req, res) => {
    try {
        const increment = await Increment.findById(req.params.id);
        if (!increment) {
            return res.status(404).json({ msg: 'Increment record not found' });
        }

        const {
            incrementDate, previousSalary, incrementAmount,
            promotionRank, reason, approvedBy, notes, status
        } = req.body;

        // ── Validation ──────────────────────────────────────────────────
        if (incrementDate !== undefined) {
            if (isNaN(new Date(incrementDate).getTime())) {
                return res.status(400).json({ msg: 'Valid increment date is required' });
            }
            increment.incrementDate = new Date(incrementDate);
        }
        if (previousSalary !== undefined) {
            if (isNaN(previousSalary) || Number(previousSalary) < 0) {
                return res.status(400).json({ msg: 'Previous salary must be a non-negative number' });
            }
            increment.previousSalary = Number(previousSalary);
        }
        if (incrementAmount !== undefined) {
            if (isNaN(incrementAmount) || Number(incrementAmount) < 0) {
                return res.status(400).json({ msg: 'Increment amount must be a non-negative number' });
            }
            increment.incrementAmount = Number(incrementAmount);
        }
        if (reason !== undefined) {
            if (!reason.trim()) return res.status(400).json({ msg: 'Reason for increment is required' });
            increment.reason = reason.trim();
        }
        if (approvedBy !== undefined) {
            if (!approvedBy.trim()) return res.status(400).json({ msg: 'Approved By field is required' });
            increment.approvedBy = approvedBy.trim();
        }
        if (notes !== undefined) increment.notes = notes;
        if (promotionRank !== undefined) {
            if (promotionRank && !VALID_RANKS.includes(promotionRank)) {
                return res.status(400).json({ msg: 'Invalid promotion rank value' });
            }
            increment.promotionRank = promotionRank || null;
        }
        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ msg: 'Status must be Pending, Approved, or Rejected' });
            }
            increment.status = status;
        }

        // ── Re-calculate salary fields ──────────────────────────────────
        increment.newSalary = increment.previousSalary + increment.incrementAmount;
        increment.incrementPercentage = increment.previousSalary > 0
            ? parseFloat(((increment.incrementAmount / increment.previousSalary) * 100).toFixed(2))
            : 0;

        increment.updatedBy = req.user.id;
        await increment.save();

        // If status is now Approved, sync employee salary & rank
        if (increment.status === 'Approved') {
            const emp = await User.findById(increment.employee);
            if (emp) {
                emp.salary = increment.newSalary;
                if (increment.promotionRank && VALID_RANKS.includes(increment.promotionRank)) {
                    emp.promotionRank = increment.promotionRank;
                }
                await emp.save();
            }
        }

        const populated = await Increment.findById(increment._id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.json(populated);
    } catch (err) {
        console.error('Error updating increment:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/increments/:id
// Delete an increment record (HR only)
// ─────────────────────────────────────────────
router.delete('/:id', [auth, isHR], async (req, res) => {
    try {
        const increment = await Increment.findById(req.params.id);
        if (!increment) {
            return res.status(404).json({ msg: 'Increment record not found' });
        }

        await Increment.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Increment record deleted successfully' });
    } catch (err) {
        console.error('Error deleting increment:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;
