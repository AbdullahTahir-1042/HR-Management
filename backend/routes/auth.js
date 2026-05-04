const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, isHR } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public (In a real app, maybe only HR can register employees)
router.post('/register', async (req, res) => {
    const { name, email, password, role, status, salary, photo, department, reportingTo, phone } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ 
            name, 
            email, 
            password, 
            role: role || 'employee',
            status,
            salary,
            photo,
            department,
            reportingTo,
            phone
        });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/users
// @desc    Get all users (HR only)
// @access  Private (HR)
router.get('/users', [auth, isHR], async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/users/:id
// @desc    Update user details (Self or HR)
// @access  Private
router.put('/users/:id', auth, async (req, res) => {
    const { name, email, role, status, salary, photo, department, reportingTo, phone, password } = req.body;

    try {
        // Check if the user is updating themselves or if they are HR
        const currentUser = await User.findById(req.user.id);
        const isSelf = req.user.id === req.params.id;
        const isHRUser = currentUser.role === 'hr';

        if (!isSelf && !isHRUser) {
            return res.status(403).json({ msg: 'Access denied. You can only update your own profile.' });
        }

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update fields (Role, Salary, Department, Status only by HR)
        if (name) user.name = name;
        if (email) user.email = email;
        if (photo !== undefined) user.photo = photo;
        if (phone !== undefined) user.phone = phone;
        if (password) user.password = password; // Pre-save middleware will hash this

        // HR-only restricted fields
        if (isHRUser) {
            if (role) user.role = role;
            if (status) user.status = status;
            if (salary !== undefined) user.salary = salary;
            if (department) user.department = department;
            if (reportingTo !== undefined) user.reportingTo = reportingTo;
        }

        await user.save();
        res.json(user);
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET api/auth/user
// @desc    Get current user details
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
