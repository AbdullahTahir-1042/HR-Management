const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const Attendance = require('../models/Attendance');

// Calculate number of working days between two dates (inclusive, skips weekends)
const calculateDays = (start, end) => {
    let startDate = new Date(start);
    let endDate = new Date(end);
    let days = 0;
    while (startDate <= endDate) {
        if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
            days++;
        }
        startDate.setDate(startDate.getDate() + 1);
    }
    return days;
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
    const { name, quota, description, maxConsecutiveDays, cooldownDays } = req.body;

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
            description: description || '',
            maxConsecutiveDays: Number(maxConsecutiveDays) || 0,
            cooldownDays: Number(cooldownDays) || 0
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
    const { name, quota, description, maxConsecutiveDays, cooldownDays } = req.body;

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
            { 
                name: name.trim(), 
                quota: numericQuota, 
                description: description || '',
                maxConsecutiveDays: Number(maxConsecutiveDays) || 0,
                cooldownDays: Number(cooldownDays) || 0
            },
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

        // Find all approved and pending leave requests for this user in the current year
        const approvedLeaves = await LeaveRequest.find({
            employee: req.user.id,
            status: { $in: ['approved', 'pending'] },
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

        // Calculate duration in working days
        const duration = calculateDays(start, end);
        if (duration <= 0) {
            return res.status(400).json({ msg: 'End date cannot be before start date.' });
        }

        if (start < today) {
            return res.status(400).json({ msg: 'Leave start date cannot be in the past.' });
        }

        // Check for overlapping existing leaves
        const overlappingLeaves = await LeaveRequest.find({
            employee: req.user.id,
            status: { $in: ['pending', 'approved'] },
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
            ]
        });

        if (overlappingLeaves.length > 0) {
            return res.status(400).json({ msg: 'You already have an active leave request during this period.' });
        }

        // Check for existing attendance during the requested period
        const dateStrings = [];
        let curr = new Date(start);
        while (curr <= end) {
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            dateStrings.push(`${yyyy}-${mm}-${dd}`);
            curr.setDate(curr.getDate() + 1);
        }

        const existingAttendance = await Attendance.find({
            employee: req.user.id,
            date: { $in: dateStrings }
        });

        if (existingAttendance.length > 0) {
            return res.status(400).json({ msg: 'You have already checked in for one or more days in this period.' });
        }

        // --- Advanced Policy Validations ---

        // 0. Annual Leave "One-Time Use" Exception Check
        if (leaveType.name === 'Annual Leave') {
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
            
            const existingAnnualLeave = await LeaveRequest.findOne({
                employee: req.user.id,
                leaveType: leaveTypeId,
                status: { $in: ['approved', 'pending'] },
                startDate: { $gte: startOfYear, $lte: endOfYear }
            });

            if (existingAnnualLeave) {
                return res.status(400).json({ 
                    msg: 'Policy Violation: Annual Leave can only be requested once per year. You have already applied for Annual Leave this year.' 
                });
            }
        }

        // 1. Max Consecutive Days Check
        if (leaveType.name !== 'Unpaid Leave') {
            if (leaveType.maxConsecutiveDays && leaveType.maxConsecutiveDays > 0) {
                if (duration > leaveType.maxConsecutiveDays) {
                    let msg = `Policy Violation: ${leaveType.name} allows a maximum of ${leaveType.maxConsecutiveDays} consecutive days per request.`;
                    if (leaveType.cooldownDays && leaveType.cooldownDays > 0) {
                        msg += ` It also requires a ${leaveType.cooldownDays}-day cooldown between requests.`;
                    }
                    return res.status(400).json({ msg });
                }
            }

            // 2. Cooldown Period Check
            if (leaveType.cooldownDays && leaveType.cooldownDays > 0) {
                // Find the most recent approved or pending leave of this type
                const lastLeave = await LeaveRequest.findOne({
                    employee: req.user.id,
                    leaveType: leaveTypeId,
                    status: { $in: ['approved', 'pending'] }
                }).sort({ endDate: -1 });

                if (lastLeave) {
                    const lastEnd = new Date(lastLeave.endDate);
                    const diffDays = Math.ceil((start - lastEnd) / (1000 * 60 * 60 * 24));
                    if (diffDays <= leaveType.cooldownDays) {
                        return res.status(400).json({
                            msg: `Policy Violation: ${leaveType.name} requires a ${leaveType.cooldownDays}-day cooldown between requests. Please wait ${leaveType.cooldownDays - diffDays + 1} more day(s).`
                        });
                    }
                }
            }

            // 3. Strict Quota Enforcement
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
            
            const approvedAndPendingLeavesThisYear = await LeaveRequest.find({
                employee: req.user.id,
                leaveType: leaveTypeId,
                status: { $in: ['approved', 'pending'] },
                startDate: { $gte: startOfYear, $lte: endOfYear }
            });

            let usedDays = 0;
            approvedAndPendingLeavesThisYear.forEach(l => {
                usedDays += calculateDays(l.startDate, l.endDate);
            });

            if (usedDays + duration > leaveType.quota) {
                return res.status(400).json({
                    msg: `Quota Exceeded: You only have ${Math.max(0, leaveType.quota - usedDays)} days of ${leaveType.name} remaining.`
                });
            }
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
            .populate('employee', ['name', 'email', 'department', 'reportingTo', 'isTeamLead'])
            .populate('leaveType')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/leaves/:id
// @desc    Delete a leave request (HR only)
// @access  Private (HR)
router.delete('/:id', [auth, isHR], async (req, res) => {
    try {
        const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
        if (!leave) {
            return res.status(404).json({ msg: 'Leave request not found' });
        }
        res.json({ msg: 'Leave request deleted successfully' });
    } catch (err) {
        console.error('Delete leave error:', err.message);
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

        const start = new Date(leave.startDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (start < today) {
            return res.status(400).json({ msg: 'Cannot edit or approve leave requests from the past.' });
        }

        leave.status = status;
        await leave.save();
        
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: leave.employee,
            title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status}.`,
            type: 'leave',
            relatedId: leave._id
        });

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