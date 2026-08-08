const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const LeaveType = require('../models/LeaveType');
const Attendance = require('../models/Attendance');

// Calculate number of raw calendar days between two dates (inclusive) for Sandwich Rule
const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // DST-Safe Calculation: Use Math.round instead of Math.ceil to prevent 25-hour days from adding an extra day
    const diffTime = Math.abs(endDate - startDate);
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
        if (isNaN(numericQuota) || numericQuota < 0 || numericQuota > 45) {
            return res.status(400).json({ msg: 'Quota must be between 0 and 45 days.' });
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
        let numericQuota = Number(quota);
        if (quota !== undefined && quota !== null && quota !== '') {
            if (isNaN(numericQuota) || numericQuota < 0 || numericQuota > 45) {
                return res.status(400).json({ msg: 'Quota must be between 0 and 45 days.' });
            }
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
        // Cascade delete: Remove all leave requests that reference this leave type
        await LeaveRequest.deleteMany({ leaveType: req.params.id });

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
            status: { $in: ['approved', 'pending_hr', 'pending_team_lead'] },
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
    const { startDate, endDate, reason, leaveTypeId, isUrgent } = req.body;

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

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ msg: 'Invalid dates provided. Please select valid calendar dates.' });
        }

        const today = new Date();
        today.setHours(0,0,0,0); // Reset time for accurate day comparison

        // Calculate duration in working days (backend recalculates securely, does not trust frontend)
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
            status: { $in: ['pending_hr', 'pending_team_lead', 'approved'] },
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

        // 1. Max Consecutive Days Check
        if (!isUrgent && leaveType.maxConsecutiveDays && leaveType.maxConsecutiveDays > 0) {
            if (duration > leaveType.maxConsecutiveDays) {
                let msg = `Policy Violation: ${leaveType.name} allows a maximum of ${leaveType.maxConsecutiveDays} consecutive days per request.`;
                if (leaveType.cooldownDays && leaveType.cooldownDays > 0) {
                    msg += ` It also requires a ${leaveType.cooldownDays}-day cooldown between requests.`;
                }
                return res.status(400).json({ msg });
            }
        }

        // 2. Cooldown Period Check
        if (!isUrgent && leaveType.cooldownDays && leaveType.cooldownDays > 0) {
            // Find the most recent approved or pending leave of this type
            const lastLeave = await LeaveRequest.findOne({
                employee: req.user.id,
                leaveType: leaveTypeId,
                status: { $in: ['approved', 'pending_hr', 'pending_team_lead'] }
            }).sort({ endDate: -1 });

            if (lastLeave) {
                const lastEnd = new Date(lastLeave.endDate);
                const diffDays = Math.round((start - lastEnd) / (1000 * 60 * 60 * 24));
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
                status: { $in: ['approved', 'pending_hr', 'pending_team_lead'] },
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

        // 4. Global Annual Leave Cap (Max 24 paid leaves per year)
        const GLOBAL_MAX_LEAVES = 24;
        const isExemptFromGlobal = ['Maternity Leave', 'Paternity Leave', 'Unpaid Leave'].includes(leaveType.name);

        if (!isExemptFromGlobal) {
            // Find all non-exempt leaves for the current year
            const allYearlyLeaves = await LeaveRequest.find({
                employee: req.user.id,
                status: { $in: ['approved', 'pending_hr', 'pending_team_lead'] },
                startDate: { $gte: startOfYear, $lte: endOfYear }
            }).populate('leaveType');

            let totalGlobalUsed = 0;
            allYearlyLeaves.forEach(l => {
                if (l.leaveType && !['Maternity Leave', 'Paternity Leave', 'Unpaid Leave'].includes(l.leaveType.name)) {
                    totalGlobalUsed += calculateDays(l.startDate, l.endDate);
                }
            });

            if (totalGlobalUsed + duration > GLOBAL_MAX_LEAVES) {
                return res.status(400).json({
                    msg: `Global Limit Exceeded: You are allowed a maximum of ${GLOBAL_MAX_LEAVES} standard paid leaves per year. You have already used ${totalGlobalUsed} days across all categories.`
                });
            }
        }

        const leave = new LeaveRequest({
            employee: req.user.id,
            startDate,
            endDate,
            reason,
            leaveType: leaveTypeId,
            isUrgent: isUrgent || false
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

// @route   PUT api/leaves/:id/hr-review
// @desc    HR review of leave (approve sends to TL, reject ends it)
// @access  Private (HR)
router.put('/:id/hr-review', [auth, isHR], async (req, res) => {
    const { action, remark } = req.body; // 'approve' or 'reject'

    try {
        let leave = await LeaveRequest.findById(req.params.id)
            .populate('leaveType')
            .populate('employee', ['isTeamLead']);
        if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

        const start = new Date(leave.startDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (start < today && (action === 'approve' || action === 'approved')) {
            return res.status(400).json({ msg: 'Cannot approve leave requests from the past.' });
        }

        leave.hrRemark = remark || '';
        leave.hrReviewedAt = new Date();
        
        if (action === 'approve' || action === 'approved') {
            if (leave.employee.isTeamLead) {
                // Team Leads don't have a team lead above them, HR approval is final
                
                // Revalidate quota for final approval
                const currentYear = new Date().getFullYear();
                const startOfYear = new Date(currentYear, 0, 1);
                const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
                
                const approvedLeavesThisYear = await LeaveRequest.find({
                    employee: leave.employee._id,
                    leaveType: leave.leaveType._id,
                    status: 'approved',
                    startDate: { $gte: startOfYear, $lte: endOfYear }
                });
                
                let usedDays = 0;
                approvedLeavesThisYear.forEach(l => {
                    const startDate = new Date(l.startDate);
                    const endDate = new Date(l.endDate);
                    const diffTime = Math.abs(endDate - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    usedDays += diffDays;
                });
                
                const startDate = new Date(leave.startDate);
                const endDate = new Date(leave.endDate);
                const diffTime = Math.abs(endDate - startDate);
                const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                
                if (usedDays + duration > leave.leaveType.quota) {
                    return res.status(400).json({
                        msg: `Cannot approve: Employee only has ${Math.max(0, leave.leaveType.quota - usedDays)} days of ${leave.leaveType.name} remaining.`
                    });
                }
                
                leave.status = 'approved';
                leave.hrDecision = 'approved';
            } else {
                leave.status = 'pending_team_lead';
                leave.hrDecision = 'approved';
            }
        } else {
            leave.status = 'hr_rejected';
            leave.hrDecision = 'rejected';
        }
        
        await leave.save();
        
        const Notification = require('../models/Notification');
        const userPrefs = await User.findById(leave.employee._id).select('notificationPreferences');
        if (!userPrefs || (userPrefs.notificationPreferences?.all !== false && userPrefs.notificationPreferences?.leaves !== false)) {
            let statusMsg;
            if (action === 'approve' || action === 'approved') {
                statusMsg = leave.employee.isTeamLead ? 'Approved by HR' : 'Reviewed by HR (Pending Team Lead)';
            } else {
                statusMsg = 'Rejected by HR';
            }
            await Notification.create({
                recipient: leave.employee._id,
                title: `Leave Request ${statusMsg}`,
                message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${statusMsg.toLowerCase()}.`,
                type: 'leave',
                relatedId: leave._id
            });
        }

        const populatedLeave = await LeaveRequest.findById(leave._id)
            .populate('employee', ['name', 'email'])
            .populate('leaveType');

        res.json(populatedLeave);
    } catch (err) {
        console.error('HR review update error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/leaves/team
// @desc    Get all leave requests for the logged-in user's team (Team Lead only)
// @access  Private
router.get('/team', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('departmentId');
        if (!user || !user.isTeamLead || !user.departmentId) {
            return res.status(403).json({ msg: 'Not authorized as Team Lead.' });
        }

        // Fetch leaves for all employees in the same department, excluding the team lead themselves
        const teamLeaves = await LeaveRequest.find({
            status: { $ne: 'pending_hr' }
        })
        .populate({
            path: 'employee',
            match: { departmentId: user.departmentId._id, _id: { $ne: user._id } },
            select: 'name email departmentId'
        })
        .populate('leaveType')
        .sort({ createdAt: -1 });

        // Filter out null employees (those who didn't match the populate condition)
        const filteredLeaves = teamLeaves.filter(leave => leave.employee != null);

        res.json(filteredLeaves);
    } catch (err) {
        console.error('Fetch team leaves error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/leaves/:id/team-lead-review
// @desc    Team Lead final review of leave (approve or reject)
// @access  Private (Team Lead only)
router.put('/:id/team-lead-review', auth, async (req, res) => {
    const { action, remark } = req.body; // 'approve' or 'reject'

    try {
        const user = await User.findById(req.user.id).populate('departmentId');
        if (!user || !user.isTeamLead) {
            return res.status(403).json({ msg: 'Not authorized as Team Lead.' });
        }

        let leave = await LeaveRequest.findById(req.params.id)
            .populate('employee', ['name', 'email', 'departmentId', '_id'])
            .populate('leaveType');
            
        if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

        if (String(leave.employee.departmentId) !== String(user.departmentId._id)) {
            return res.status(403).json({ msg: 'Not authorized to review leaves for this department.' });
        }

        const start = new Date(leave.startDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        if (start < today && (action === 'approve' || action === 'approved')) {
            return res.status(400).json({ msg: 'Cannot approve leave requests from the past.' });
        }

        // Prevent self-approval by Team Leads
        if (leave.employee._id.toString() === req.user.id) {
            return res.status(403).json({ msg: 'You cannot review your own leave requests.' });
        }

        leave.teamLeadRemark = remark || '';
        leave.teamLeadReviewedAt = new Date();
        
        if (action === 'approve') {
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
            const approvedLeavesThisYear = await LeaveRequest.find({
                employee: leave.employee._id,
                leaveType: leave.leaveType._id,
                status: 'approved',
                startDate: { $gte: startOfYear, $lte: endOfYear }
            });
            let usedDays = 0;
            approvedLeavesThisYear.forEach(l => {
                const startDate = new Date(l.startDate);
                const endDate = new Date(l.endDate);
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                usedDays += diffDays;
            });
            
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const diffTime = Math.abs(endDate - startDate);
            const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            if (usedDays + duration > leave.leaveType.quota) {
                return res.status(400).json({
                    msg: `Cannot approve: Employee only has ${Math.max(0, leave.leaveType.quota - usedDays)} days of ${leave.leaveType.name} remaining.`
                });
            }
        }
        if (action === 'approve' || action === 'approved') {
            leave.status = 'approved';
            leave.teamLeadDecision = 'approved';
        } else {
            leave.status = 'rejected';
            leave.teamLeadDecision = 'rejected';
        }
        
        await leave.save();
        
        const Notification = require('../models/Notification');
        const userPrefs = await User.findById(leave.employee._id).select('notificationPreferences');
        if (!userPrefs || (userPrefs.notificationPreferences?.all !== false && userPrefs.notificationPreferences?.leaves !== false)) {
            const statusMsg = (action === 'approve' || action === 'approved') ? 'Approved by Team Lead' : 'Rejected by Team Lead';
            await Notification.create({
                recipient: leave.employee._id,
                title: `Leave Request ${statusMsg}`,
                message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${statusMsg.toLowerCase()}.`,
                type: 'leave',
                relatedId: leave._id
            });
        }

        const populatedLeave = await LeaveRequest.findById(leave._id)
            .populate('employee', ['name', 'email'])
            .populate('leaveType');

        res.json(populatedLeave);
    } catch (err) {
        console.error('Team Lead leave review error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;