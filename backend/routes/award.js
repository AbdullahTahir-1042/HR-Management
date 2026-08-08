const express = require('express');
const router = express.Router();
const Award = require('../models/Award');
const { auth, isHR } = require('../middleware/auth');

// GET all awards for a specific employee
router.get('/employee/:employeeId', auth, async (req, res) => {
    try {
        const awards = await Award.find({ employee: req.params.employeeId })
            .populate('awardedBy', 'name')
            .sort({ date: -1 });
        res.json(awards);
    } catch (err) {
        console.error('Error fetching awards:', err);
        res.status(500).json({ msg: 'Server error fetching awards' });
    }
});

// POST give an award to an employee - HR or Team Lead
router.post('/', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const reqUser = await User.findById(req.user.id);
        const { title, description, employeeId, date } = req.body;
        
        if (!title || !employeeId) {
            return res.status(400).json({ msg: 'Award title and Employee ID are required' });
        }

        const employee = await User.findById(employeeId);
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });

        // Permission check: Must be HR, Admin, or the employee's Team Lead
        if (reqUser.role !== 'hr' && reqUser.role !== 'admin') {
            if (!reqUser.isTeamLead || reqUser.departmentId?.toString() !== employee.departmentId?.toString()) {
                return res.status(403).json({ msg: 'Not authorized to give award to this employee' });
            }
        }
        
        const award = await Award.create({
            title: title.trim(),
            description: (description || '').trim(),
            employee: employeeId,
            date: date ? new Date(date) : new Date(),
            awardedBy: req.user.id
        });
        
        const populated = await award.populate('awardedBy', 'name');
        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating award:', err);
        res.status(500).json({ msg: 'Server error creating award' });
    }
});

// DELETE an award - HR only
router.delete('/:id', auth, isHR, async (req, res) => {
    try {
        const award = await Award.findByIdAndDelete(req.params.id);
        if (!award) return res.status(404).json({ msg: 'Award not found' });
        res.json({ msg: 'Award deleted' });
    } catch (err) {
        console.error('Error deleting award:', err);
        res.status(500).json({ msg: 'Server error deleting award' });
    }
});

// GET all awards - HR only
router.get('/', auth, isHR, async (req, res) => {
    try {
        const awards = await Award.find()
            .populate('employee', 'name email department')
            .populate('awardedBy', 'name')
            .sort({ date: -1 });
        res.json(awards);
    } catch (err) {
        console.error('Error fetching all awards:', err);
        res.status(500).json({ msg: 'Server error fetching all awards' });
    }
});

module.exports = router;
