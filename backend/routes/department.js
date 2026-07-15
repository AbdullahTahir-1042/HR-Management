const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');

// GET all departments
router.get('/all', async (req, res) => {
    try {
        const departments = await Department.find({ isDeleted: false });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// POST create new department
router.post('/add', async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if department already exists (case-insensitive via collation)
        const existing = await Department.findOne({ 
            name,
            isDeleted: false 
        }).collation({ locale: 'en', strength: 2 });

        if (existing) {
            return res.status(400).json({ 
                msg: 'Department with this name already exists' 
            });
        }

        const dept = new Department({ name, description });
        await dept.save();
        res.json({ msg: 'Department created successfully', dept });

    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// PUT update department
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check duplicate name ignoring current department (case-insensitive via collation)
        const existing = await Department.findOne({
            name,
            isDeleted: false,
            _id: { $ne: req.params.id }
        }).collation({ locale: 'en', strength: 2 });

        if (existing) {
            return res.status(400).json({ 
                msg: 'Department with this name already exists' 
            });
        }

        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true }
        );

        res.json({ msg: 'Department updated successfully', dept });

    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE department
router.delete('/:id', async (req, res) => {
    try {
        // Check if any employees are in this department
        const dept = await Department.findById(req.params.id);
        
        const employeesInDept = await User.findOne({ 
            department: dept.name.toLowerCase(),
            isDeleted: false 
        });

        if (employeesInDept) {
            return res.status(400).json({ 
                msg: 'Cannot delete! Employees are assigned to this department.' 
            });
        }

        // Soft delete
        await Department.findByIdAndUpdate(req.params.id, { 
            isDeleted: true 
        });

        res.json({ msg: 'Department deleted successfully' });

    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;