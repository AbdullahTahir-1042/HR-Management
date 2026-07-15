const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');

// Calculate number of days between two dates (inclusive)
const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// @route   GET api/leaves/types
// @desc    Get all leave types
// @access  Private
router.get('/types', auth, async (req, res) => {
    try {
        const types = await LeaveType.find().sort({ name: 1 });
        res.json(types);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/leaves/types
// @desc    Create a new leave type (HR only)
// @access  Private (HR)
router.post('/types', [auth, isHR], async (req, res) => {
    const { name, quota, description } = req.body;

    try {
        if (!name || name.trim() === '') {
            return res.status(400).json({ msg: 'Leave type name is required.' });
        }
        if (quota === undefined || quota === null || quota === '') {
            return res.status(400).json({ msg: 'Leave quota is required.' });
        }
        const numericQuota = Number(quota);
        if (isNaN(numericQuota) || numericQuota < 0) {
            return res.status(400).json({ msg: 'Quota must be a non-negative number.' });
        }

        // Duplicate name validation (case-insensitive)
        const duplicate = await LeaveType.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
        if (duplicate) {
            return res.status(400).json({ msg: 'A leave type with this name already exists.' });
        }

        const leaveType = new LeaveType({
            name: name.trim(),
            quota: numericQuota,
            description: description || ''
        });

        await leaveType.save();
        res.json(leaveType);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/leaves/types/:id
// @desc    Update a leave type (HR only)
// @access  Private (HR)
router.put('/types/:id', [auth, isHR], async (req, res) => {
    const { name, quota, description } = req.body;

    try {
        if (!name || name.trim() === '') {
            return res.status(400).json({ msg: 'Leave type name is required.' });
        }
        if (quota === undefined || quota === null || quota === '') {
            return res.status(400).json({ msg: 'Leave quota is required.' });
        }
        const numericQuota = Number(quota);
        if (isNaN(numericQuota) || numericQuota < 0) {
            return res.status(400).json({ msg: 'Quota must be a non-negative number.' });
        }

        // Duplicate check (excluding self)
        const duplicate = await LeaveType.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (duplicate) {
            return res.status(400).json({ msg: 'A leave type with this name already exists.' });
        }

        const leaveType = await LeaveType.findByIdAndUpdate(
            req.params.id,
            { name: name.trim(), quota: numericQuota, description: description || '' },
            { new: true }
        );

        if (!leaveType) {
            return res.status(404).json({ msg: 'Leave type not found.' });
        }

        res.json(leaveType);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/leaves/types/:id
// @desc    Delete a leave type (HR only)
// @access  Private (HR)
router.delete('/types/:id', [auth, isHR], async (req, res) => {
    try {
        // Prevent deleting if referenced by any leave request
        const referenced = await LeaveRequest.findOne({ leaveType: req.params.id });
        if (referenced) {
            return res.status(400).json({ msg: 'Cannot delete leave type. It is already referenced by existing leave requests.' });
        }

        const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
        if (!leaveType) {
            return res.status(404).json({ msg: 'Leave type not found.' });
        }

        res.json({ msg: 'Leave type deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/balances
// @desc    Get user's leave balances dynamically
// @access  Private
router.get('/balances', auth, async (req, res) => {
    try {
        const types = await LeaveType.find().sort({ name: 1 });
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        // Find all approved leave requests for this user in the current year
        const approvedLeaves = await LeaveRequest.find({
            employee: req.user.id,
            status: 'approved',
            startDate: { $gte: startOfYear, $lte: endOfYear }
        });

        // Compute used days per leave type
        const usedMap = {};
        approvedLeaves.forEach(leave => {
            const days = calculateDays(leave.startDate, leave.endDate);
            if (leave.leaveType) {
                const typeIdStr = leave.leaveType.toString();
                usedMap[typeIdStr] = (usedMap[typeIdStr] || 0) + days;
            }
        });

        const balances = types.map(t => {
            const used = usedMap[t._id.toString()] || 0;
            return {
                leaveType: t,
                allocated: t.quota,
                used,
                remaining: Math.max(0, t.quota - used)
            };
        });

        res.json(balances);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/leaves/apply
// @desc    Employee Apply for Leave
// @access  Private
router.post('/apply', auth, async (req, res) => {
    const { startDate, endDate, reason, leaveTypeId } = req.body;

    try {
        if (!leaveTypeId) {
            return res.status(400).json({ msg: 'Leave type is required.' });
        }

        const leaveType = await LeaveType.findById(leaveTypeId);
        if (!leaveType) {
            return res.status(404).json({ msg: 'Leave type not found.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0,0,0,0); // Reset time for accurate day comparison

        // Calculate duration in days
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate days from today to start date
        const noticePeriod = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

        if (duration === 1 && noticePeriod < 4) {
            return res.status(400).json({ msg: 'One-day leave must be requested at least 4 days in advance.' });
        }
        if (duration > 1 && noticePeriod < 8) {
            return res.status(400).json({ msg: 'Multi-day leave must be requested at least 8 days in advance.' });
        }

        // Validate leave balance
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        // Find all approved leave requests for this user in the current year of this type
        const approvedLeaves = await LeaveRequest.find({
            employee: req.user.id,
            status: 'approved',
            leaveType: leaveTypeId,
            startDate: { $gte: startOfYear, $lte: endOfYear }
        });

        let usedDays = 0;
        approvedLeaves.forEach(leave => {
            usedDays += calculateDays(leave.startDate, leave.endDate);
        });

        const remaining = leaveType.quota - usedDays;
        if (duration > remaining) {
            return res.status(400).json({
                msg: `Insufficient leave balance for ${leaveType.name}. Remaining: ${remaining} day(s), requested: ${duration} day(s).`
            });
        }

        const leave = new LeaveRequest({
            employee: req.user.id,
            startDate,
            endDate,
            reason,
            leaveType: leaveTypeId
        });

        await leave.save();

        const populatedLeave = await LeaveRequest.findById(leave._id)
            .populate('employee', ['name', 'email'])
            .populate('leaveType');

        res.json(populatedLeave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/my-leaves
// @desc    Get employee's leave requests
// @access  Private
router.get('/my-leaves', auth, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ employee: req.user.id })
            .populate('employee', ['name', 'email'])
            .populate('leaveType')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/all
// @desc    Get all leave requests (HR only)
// @access  Private (HR)
router.get('/all', [auth, isHR], async (req, res) => {
    try {
        const leaves = await LeaveRequest.find()
            .populate('employee', ['name', 'email'])
            .populate('leaveType')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/leaves/:id/status
// @desc    Update leave status (HR only)
// @access  Private (HR)
router.put('/:id/status', [auth, isHR], async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'

    try {
        let leave = await LeaveRequest.findById(req.params.id).populate('leaveType');
        if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

        // Validate leave balance before approving
        if (status === 'approved' && leave.status !== 'approved') {
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

            // Fetch approved leaves of this type for the employee this year
            const approvedLeaves = await LeaveRequest.find({
                employee: leave.employee,
                status: 'approved',
                leaveType: leave.leaveType._id,
                startDate: { $gte: startOfYear, $lte: endOfYear }
            });

            let usedDays = 0;
            approvedLeaves.forEach(l => {
                usedDays += calculateDays(l.startDate, l.endDate);
            });

            const requestedDays = calculateDays(leave.startDate, leave.endDate);
            const remaining = leave.leaveType.quota - usedDays;

            if (requestedDays > remaining) {
                return res.status(400).json({
                    msg: `Cannot approve. Insufficient leave balance for ${leave.leaveType.name}. Remaining: ${remaining} day(s), requested: ${requestedDays} day(s).`
                });
            }
        }

        leave.status = status;
        await leave.save();

        const populatedLeave = await LeaveRequest.findById(leave._id)
            .populate('employee', ['name', 'email'])
            .populate('leaveType');

        res.json(populatedLeave);
    } catch (err) {
        console.error('Leave status update error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;