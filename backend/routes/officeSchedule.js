const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const OfficeSchedule = require('../models/OfficeSchedule');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { messaging } = require('../config/firebaseAdmin'); // ✅ NEW

// @route   GET api/office-schedule
// @desc    Get all active schedules (default and upcoming overrides)
// @access  Private (HR)
router.get('/', [auth, isHR], async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const schedules = await OfficeSchedule.find().sort({ isDefault: -1, date: 1 });
        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/office-schedule/today
// @desc    Get today's active schedule for employee dashboard
// @access  Private
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Check for a date-specific override
        const overrideSchedule = await OfficeSchedule.findOne({ date: today, isDefault: false });
        if (overrideSchedule) {
            return res.json(overrideSchedule);
        }
        
        // 2. Otherwise return the default schedule
        const defaultSchedule = await OfficeSchedule.findOne({ isDefault: true });
        res.json(defaultSchedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/office-schedule/upcoming
// @desc    Get upcoming active schedule overrides for employee dashboard
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const upcomingOverrides = await OfficeSchedule.find({
            isDefault: false,
            date: { $gt: today }
        }).sort({ date: 1 }).limit(5); // Show up to 5 upcoming changes
        
        res.json(upcomingOverrides);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper for formatting time strings to 12hr in notifications
const formatTime12hr = (timeString) => {
    if (!timeString) return '';
    const [h, m] = timeString.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
};

// @route   POST api/office-schedule
// @desc    Create a new schedule (default or override)
// @access  Private (HR)
router.post('/', [auth, isHR], async (req, res) => {
    try {
        // Accept startDate and endDate instead of date for overrides
        const { isDefault, startDate, endDate, startTime, endTime, gracePeriod, workingDays, reason, notifyEmployees } = req.body;

        // Basic validation
        if (!startTime || !endTime) {
            return res.status(400).json({ msg: 'Start time and end time are required' });
        }
        if (startTime >= endTime) {
            return res.status(400).json({ msg: 'Start time must be before end time' });
        }
        if (!isDefault && (!startDate || !endDate)) {
            return res.status(400).json({ msg: 'Start Date and End Date are required for an override schedule' });
        }

        let createdSchedules = [];
        let singleScheduleToReturn = null;
        
        if (isDefault) {
            let schedule = await OfficeSchedule.findOne({ isDefault: true });
            if (schedule) {
                // Update existing default
                schedule.startTime = startTime;
                schedule.endTime = endTime;
                schedule.gracePeriod = gracePeriod || 15;
                schedule.workingDays = workingDays || [1, 2, 3, 4, 5];
                schedule.updatedBy = req.user.id;
                await schedule.save();
                singleScheduleToReturn = schedule;
            } else {
                schedule = new OfficeSchedule({
                    isDefault: true,
                    startTime,
                    endTime,
                    gracePeriod: gracePeriod || 15,
                    workingDays: workingDays || [1, 2, 3, 4, 5],
                    createdBy: req.user.id
                });
                await schedule.save();
                singleScheduleToReturn = schedule;
            }
        } else {
            // Generate array of dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                return res.status(400).json({ msg: 'Start date must be before or equal to end date' });
            }

            const datesToCreate = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                datesToCreate.push(d.toISOString().split('T')[0]);
            }

            // Check if any of these dates already have an override
            const existingOverrides = await OfficeSchedule.find({ date: { $in: datesToCreate }, isDefault: false });
            if (existingOverrides.length > 0) {
                return res.status(400).json({ msg: `Overrides already exist for some of these dates (e.g. ${existingOverrides[0].date})` });
            }

            const docs = datesToCreate.map(d => ({
                isDefault: false,
                date: d,
                startTime,
                endTime,
                gracePeriod: gracePeriod || 15,
                reason: reason || '',
                createdBy: req.user.id
            }));

            createdSchedules = await OfficeSchedule.insertMany(docs);
            singleScheduleToReturn = createdSchedules[0]; // Just return one for UI if they need it, UI usually re-fetches
        }

        // Notification logic
        if (notifyEmployees) {
            const employees = await User.find({ status: { $ne: 'Inactive' } });
            const title = isDefault ? 'Default Office Schedule Updated' : 'Office Schedule Updated';
            let message = '';
            
            const timeStr = `${formatTime12hr(startTime)} - ${formatTime12hr(endTime)}`;

            if (isDefault) {
                message = `The default office timings have been updated to ${timeStr}.`;
            } else {
                if (startDate === endDate) {
                    message = `The office timing for ${new Date(startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} has been changed to ${timeStr}.`;
                } else {
                    message = `The office timings from ${new Date(startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} to ${new Date(endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} have been changed to ${timeStr}.`;
                }
            }
            
            if (reason && !isDefault) {
                message += ` Reason: ${reason}`;
            }

            const notifications = employees.map(emp => ({
                recipient: emp._id,
                title,
                message,
                type: 'system'
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }

            // --- FIREBASE PUSH NOTIFICATION ---
            try {
                const usersWithTokens = await User.find({ fcmToken: { $exists: true, $ne: null } });
                const rawTokens = usersWithTokens
                    .filter(u => u.notificationPreferences?.all !== false)
                    .map(user => user.fcmToken);
                
                const uniqueTokens = [...new Set(rawTokens)];

                if (uniqueTokens.length > 0) {
                    const messagePayload = {
                        tokens: uniqueTokens,
                        notification: { title, body: message },
                        data: { title, body: message }
                    };
                    await messaging.sendEachForMulticast(messagePayload);
                }
            } catch (firebaseErr) {
                console.error('Firebase Broadcast Error:', firebaseErr);
            }
            // ----------------------------------
        }

        res.json(singleScheduleToReturn);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/office-schedule/:id
// @desc    Update a specific schedule override
// @access  Private (HR)
router.put('/:id', [auth, isHR], async (req, res) => {
    try {
        const { startTime, endTime, gracePeriod, reason, notifyEmployees } = req.body;

        if (startTime && endTime && startTime >= endTime) {
            return res.status(400).json({ msg: 'Start time must be before end time' });
        }

        const schedule = await OfficeSchedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        if (startTime) schedule.startTime = startTime;
        if (endTime) schedule.endTime = endTime;
        if (gracePeriod !== undefined) schedule.gracePeriod = gracePeriod;
        if (reason !== undefined) schedule.reason = reason;
        schedule.updatedBy = req.user.id;

        await schedule.save();

        if (notifyEmployees && !schedule.isDefault && schedule.date) {
            const employees = await User.find({ status: 'active' });
            const title = 'Office Schedule Updated';
            let message = `The office timing for ${new Date(schedule.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} has been updated to ${schedule.startTime} - ${schedule.endTime}.`;
            if (schedule.reason) {
                message += ` Reason: ${schedule.reason}`;
            }

            const notifications = employees.map(emp => ({
                recipient: emp._id,
                title,
                message,
                type: 'system'
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/office-schedule/:id
// @desc    Delete a specific schedule override
// @access  Private (HR)
router.delete('/:id', [auth, isHR], async (req, res) => {
    try {
        const schedule = await OfficeSchedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        if (schedule.isDefault) {
            return res.status(400).json({ msg: 'Cannot delete the default schedule' });
        }

        await schedule.deleteOne();
        res.json({ msg: 'Schedule override removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Schedule not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
