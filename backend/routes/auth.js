const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const { auth, isHR } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user (HR only)
// @access  Private (HR)
router.post('/register', [auth, isHR], async (req, res) => {
    let { name, email, password, role, status, salary, photo, department, reportingTo, phone } = req.body;
    if (email) email = email.toLowerCase();

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
    let { email, password } = req.body;
    if (email) email = email.toLowerCase();
    console.log('Login attempt:', email);

    try {
        let user = await User.findOne({ email });
        if (!user || user.isDeleted) {
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
        const users = await User.find({ isDeleted: { $ne: true } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/users/:id
// @desc    Update user details (Self or HR)
// @access  Private
router.put('/users/:id', auth, async (req, res) => {
    let { name, email, role, status, salary, photo, department, reportingTo, phone, password } = req.body;
    if (email) email = email.toLowerCase();

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
            if (role !== undefined) user.role = role;
            if (status !== undefined) user.status = status;
            if (salary !== undefined) user.salary = salary;
            if (department !== undefined) user.department = department;
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

// @route   DELETE api/auth/users/:id
// @desc    Delete user and their related data (HR only)
// @access  Private (HR)
router.delete('/users/:id', [auth, isHR], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Don't allow HR to delete themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ msg: 'You cannot delete your own account' });
        }

        // Soft Delete the user
        user.isDeleted = true;
        await user.save();

        res.json({ msg: 'User soft-deleted successfully' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/fcm-token
// @desc    Save the employee's browser push notification token
// @access  Private
router.put('/fcm-token', auth, async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ msg: 'Token is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.fcmToken = token;
        await user.save();
        
        res.json({ msg: 'Notification token synced successfully' });
    } catch (err) {
        console.error('Error saving FCM token:', err);
        res.status(500).send('Server Error syncing token');
    }
});

module.exports = router;