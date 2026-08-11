const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { auth, isHR } = require('../middleware/auth');
const HRRequest = require('../models/HRRequest');
const LoanRequest = require('../models/LoanRequest');
const MistakeReport = require('../models/MistakeReport');
const Notification = require('../models/Notification');
const Increment = require('../models/Increment');
const PerformanceReview = require('../models/PerformanceReview');
const TypingStatus = require('../models/TypingStatus');
const { sendEmail } = require('../services/emailService');
const { getWelcomeEmailTemplate } = require('../templates/welcomeEmail');
const { getOtpEmailTemplate } = require('../templates/otpEmail');

// @route   POST api/auth/register
// @desc    Register user (HR only)
// @access  Private (HR)
router.post('/register', [auth, isHR], async (req, res) => {
    let { name, email, password, role, status, salary, photo, department, reportingTo, phone, isTeamLead, joiningStatus, promotionRank, contractDetails, shiftDetails } = req.body;
    if (email) email = email.toLowerCase().trim();
    if (phone) phone = phone.trim();

    // ── Server-Side Strong Validations ───────────────────────────────────────
    if (!name || name.trim().length < 3) {
        return res.status(400).json({ msg: 'Full name must be at least 3 characters long' });
    }
    const nameWords = name.trim().split(/\s+/);
    if (nameWords.length < 2) {
        return res.status(400).json({ msg: 'Please provide both first and last name (e.g. John Doe)' });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({ msg: 'Please provide a valid work email address' });
    }
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    if (!phone || phoneDigits.length < 10 || phoneDigits.length > 15) {
        return res.status(400).json({ msg: 'Phone number must contain between 10 and 15 digits' });
    }
    if (/^(\d)\1{8,}$/.test(phoneDigits) || phoneDigits === '1234567890' || phoneDigits === '0123456789' || phoneDigits === '9876543210') {
        return res.status(400).json({ msg: 'Please provide a valid, real phone number (repetitive or sequential dummy digits are not allowed)' });
    }
    if (!password || password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters with at least one letter and one number' });
    }
    if (salary === undefined || salary === null || isNaN(salary) || Number(salary) < 10000 || Number(salary) > 50000000) {
        return res.status(400).json({ msg: 'Annual salary must be a valid number between ₨ 10,000 and ₨ 50,000,000' });
    }
    const validJoiningStatuses = ['Intern', 'Fresh Join'];
    if (!joiningStatus || !validJoiningStatuses.includes(joiningStatus)) {
        return res.status(400).json({ msg: 'Employee Joining Status is required and must be either Intern or Fresh Join' });
    }

    const validRanks = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];
    let initialRank = promotionRank;
    if (!initialRank || !validRanks.includes(initialRank)) {
        initialRank = joiningStatus === 'Intern' ? 'Intern' : 'Junior';
    }


    try {
        let existingUser = await User.findOne({ 
            $or: [
                { email },
                { phone: phone }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ msg: 'An account with this email address already exists' });
            }
            if (existingUser.phone === phone) {
                return res.status(400).json({ msg: 'An account with this phone number already exists' });
            }
        }

        let departmentId = null;
        if (department) {
            const dept = await Department.findOne({ name: { $regex: new RegExp('^' + department + '$', 'i') }, isDeleted: false });
            if (dept) {
                departmentId = dept._id;
            }
        }

        const rawPassword = password;
        const newUser = new User({
            name: name.trim(),
            email,
            password,
            role: role || 'employee',
            status,
            joiningStatus,
            promotionRank: initialRank,
            salary,
            photo,
            department,
            departmentId,
            reportingTo,
            phone,
            isTeamLead: !!isTeamLead,
            isFirstLogin: true,
            contractDetails: contractDetails || {},
            shiftDetails: shiftDetails || { startTime: '09:00', endTime: '19:00', gracePeriod: 0 }
        });
        await newUser.save();

        if (departmentId) {
            await Department.findByIdAndUpdate(departmentId, {
                $addToSet: { employees: newUser._id }
            });

            // If marked as team lead, update department and remove flag from previous lead
            if (isTeamLead) {
                const dept = await Department.findById(departmentId);
                if (dept.teamLead && dept.teamLead.toString() !== newUser._id.toString()) {
                    await User.findByIdAndUpdate(dept.teamLead, { isTeamLead: false });
                }
                dept.teamLead = newUser._id;
                await dept.save();
            }
        }

        // ── Dispatch Welcome Email via Email Service ──
        try {
            const template = getWelcomeEmailTemplate({
                name: newUser.name,
                email: newUser.email,
                tempPassword: rawPassword
            });
            sendEmail({
                to: newUser.email,
                subject: template.subject,
                html: template.html
            }).catch(e => console.error('Error sending welcome email:', e));
        } catch (wErr) {
            console.error('Error generating welcome email template:', wErr);
        }

        const payload = { user: { id: newUser.id } };
        const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';
        const token = jwt.sign(payload, secret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isTeamLead: newUser.isTeamLead,
                isFirstLogin: true
            }
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
    if (email) email = email.toLowerCase().trim();
    if (password) password = password.trim();
    console.log('Login attempt:', email);

    try {
        let user = await User.findOne({ email });
        if (!user || user.isDeleted) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.status === 'Inactive') {
            return res.status(403).json({ msg: 'Account is inactive. Please contact HR.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };
        const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';
        const token = jwt.sign(payload, secret, { expiresIn: '7d' });

        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamName: user.teamName || '',
                isFirstLogin: user.isFirstLogin === true,
                shiftDetails: user.shiftDetails
            }
        });
    } catch (err) {
        console.error('Login Route Error:', err);
        res.status(500).json({ msg: 'Server error during login', error: err.message });
    }
});

// @route   POST api/auth/forgot-password
// @desc    Generate OTP and send email
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'Please provide an email' });
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email });
        if (!user || user.isDeleted) {
            return res.status(404).json({ msg: 'No account found with that email address.' });
        }

        const hrUsers = await User.find({ role: 'hr' });
        for (let hr of hrUsers) {
            await Notification.create({
                recipient: hr._id,
                type: 'system',
                title: 'Password Reset Request',
                message: `Employee ${user.name} (${user.email}) has requested a password reset. Please set a temporary password for them in their profile settings.`,
                isRead: false
            });
        }

        // Create HR Request for Password Reset
        await HRRequest.create({
            employee: user._id,
            type: 'Password Reset',
            description: `Password reset requested by ${user.name} (${user.email})`,
            status: 'Pending'
        });

        return res.status(200).json({ 
            bypassOtp: true, 
            msg: 'A password reset request has been sent to HR directly. They will provide you with a temporary password soon.' 
        });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/auth/reset-password
// @desc    Verify OTP and reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        let { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ msg: 'Please provide email, OTP, and new password' });
        }
        email = email.toLowerCase().trim();

        const user = await User.findOne({ email });
        if (!user || user.isDeleted) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        if (!user.resetOtp || !user.resetOtpExpire) {
            return res.status(400).json({ msg: 'No password reset requested' });
        }

        if (Date.now() > user.resetOtpExpire) {
            user.resetOtp = null;
            user.resetOtpExpire = null;
            await user.save();
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp.toString(), user.resetOtp);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // The pre('save') hook will automatically hash the password.
        // We MUST NOT hash it here, otherwise it will get double-hashed.
        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpire = null;
        await user.save();

        res.status(200).json({ msg: 'Password has been successfully reset.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ msg: 'Server error' });
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

// @route   GET api/auth/colleagues
// @desc    Get a lightweight directory of everyone in the company (for messaging, etc.)
// @access  Private
router.get('/colleagues', auth, async (req, res) => {
    try {
        const users = await User.find({ isDeleted: { $ne: true }, status: { $ne: 'Inactive' }, _id: { $ne: req.user.id } })
            .select('name email photo role department')
            .sort({ name: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/users/:id
// @desc    Update user details (Self or HR)
// @access  Private
router.put('/users/:id', auth, async (req, res) => {
    let { name, email, role, status, salary, photo, department, reportingTo, phone, password, isTeamLead, promotionRank, joiningStatus, notificationPreferences, shiftDetails } = req.body;
    if (email) email = email.toLowerCase();

    try {
        const currentUser = await User.findById(req.user.id);
        const isSelf = req.user.id === req.params.id;
        const isHRUser = currentUser.role === 'hr';

        if (!isSelf && !isHRUser) {
            return res.status(403).json({ msg: 'Access denied. You can only update your own profile.' });
        }

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (photo !== undefined) user.photo = photo;
        if (phone !== undefined) user.phone = phone;
        if (password) {
            user.password = password.trim();
            if (isHRUser && !isSelf) {
                user.isFirstLogin = true; // Force employee to change temporary password
            }
        }
        if (notificationPreferences !== undefined) {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...notificationPreferences
            };
        }

        if (isHRUser) {
                if (role !== undefined) user.role = role;
                if (status !== undefined) user.status = status;
                if (salary !== undefined) user.salary = salary;
                if (promotionRank !== undefined) {
                    const validRanks = ['Intern', 'Junior', 'Associate', 'Mid-Level', 'Senior', 'Lead', 'Manager'];
                    if (!validRanks.includes(promotionRank)) {
                        return res.status(400).json({ msg: 'Invalid Promotion Rank value' });
                    }
                    user.promotionRank = promotionRank;
                }
                if (joiningStatus !== undefined) {
                    const validJoiningStatuses = ['Intern', 'Fresh Join'];
                    if (!validJoiningStatuses.includes(joiningStatus)) {
                        return res.status(400).json({ msg: 'Invalid Joining Status value' });
                    }
                    user.joiningStatus = joiningStatus;
                }

            if (department !== undefined && isHRUser) {
                const oldDeptId = user.departmentId;
                const newDept = await Department.findOne({ name: { $regex: new RegExp('^' + department + '$', 'i') }, isDeleted: false });

                user.department = department;
                user.departmentId = newDept ? newDept._id : null;

                // Sync department membership changes
                if (oldDeptId && oldDeptId.toString() !== (newDept ? newDept._id.toString() : '')) {
                    await Department.findByIdAndUpdate(oldDeptId, { $pull: { employees: user._id } });
                    // Clear previous team lead reference
                    await Department.findOneAndUpdate(
                        { _id: oldDeptId, teamLead: user._id },
                        { $set: { teamLead: null } }
                    );
                }
                if (newDept) {
                    await Department.findByIdAndUpdate(newDept._id, { $addToSet: { employees: user._id } });
                }
            }
            if (reportingTo !== undefined) user.reportingTo = reportingTo;

            // Handle isTeamLead toggle
            if (isTeamLead !== undefined) {
                const wasTeamLead = user.isTeamLead;
                user.isTeamLead = !!isTeamLead;

                const userDeptId = user.departmentId;
                if (userDeptId) {
                    if (isTeamLead && !wasTeamLead) {
                        // Becoming team lead — remove flag from previous lead
                        const dept = await Department.findById(userDeptId);
                        if (dept) {
                            if (dept.teamLead && dept.teamLead.toString() !== user._id.toString()) {
                                await User.findByIdAndUpdate(dept.teamLead, { isTeamLead: false });
                            }
                            dept.teamLead = user._id;
                            await dept.save();
                        }
                    } else if (!isTeamLead && wasTeamLead) {
                        // Removing team lead — clear department's teamLead ref
                        await Department.findByIdAndUpdate(userDeptId, { teamLead: null });
                    }
                }
            }

            if (shiftDetails !== undefined) {
                user.shiftDetails = {
                    ...(user.shiftDetails || {}),
                    ...shiftDetails
                };
            }
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
        const user = await User.findById(req.user.id).select('-password').populate('departmentId', 'shiftDetails name');
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

        if (req.user.id === req.params.id) {
            return res.status(400).json({ msg: 'You cannot delete your own account' });
        }

        const currentUser = await User.findById(req.user.id);
        const isHRUser = currentUser.role === 'hr';

        if (user.status === 'Inactive') {
            // Hard delete the employee completely from the database
            await User.deleteOne({ _id: req.params.id });

            // Cascade delete all related records to avoid null references in UI
            await Promise.all([
                Attendance.deleteMany({ employee: req.params.id }),
                LeaveRequest.deleteMany({ employee: req.params.id }),
                HRRequest.deleteMany({ employee: req.params.id }),
                LoanRequest.deleteMany({ employee: req.params.id }),
                MistakeReport.deleteMany({ $or: [{ agentId: req.params.id }, { submittedBy: req.params.id }] }),
                Increment.deleteMany({ $or: [{ employee: req.params.id }, { createdBy: req.params.id }] }),
                PerformanceReview.deleteMany({ $or: [{ employee: req.params.id }, { createdBy: req.params.id }] }),
                Notification.deleteMany({ recipient: req.params.id }),
                TypingStatus.deleteMany({ user: req.params.id })
            ]);
            
        } else {
            // Shift to Inactive instead of hard delete
            user.status = 'Inactive';
            user.isDeleted = false; // Still visible to HR, but blocked from login
            user.isTeamLead = false; // Remove them from Team Lead if they are one
            await user.save();
        }

        // Clean up conversations and messages for the deleted user
        const userConversations = await Conversation.find({ participants: req.params.id });

        for (const conv of userConversations) {
            if (conv.type === 'dm') {
                // Delete all messages in the DM
                await Message.deleteMany({ conversation: conv._id });
                // Delete the DM conversation
                await Conversation.deleteOne({ _id: conv._id });
            } else if (conv.type === 'group') {
                // Remove user from participants and admins
                await Conversation.updateOne(
                    { _id: conv._id },
                    { $pull: { participants: req.params.id, admins: req.params.id } }
                );

                // Fetch updated conversation to see if it's now empty
                const updatedConv = await Conversation.findById(conv._id);
                if (!updatedConv || !updatedConv.participants || updatedConv.participants.length === 0) {
                    await Message.deleteMany({ conversation: conv._id });
                    await Conversation.deleteOne({ _id: conv._id });
                } else {
                    // If no admins are left, promote the first participant to admin
                    if (!updatedConv.admins || updatedConv.admins.length === 0) {
                        updatedConv.admins = [updatedConv.participants[0]];
                        await updatedConv.save();
                    }
                }
            }
        }

        res.json({ msg: 'User marked as Inactive' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/users/:id/restore
// @desc    Restore a user (HR only)
// @access  Private (HR)
router.put('/users/:id/restore', [auth, isHR], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.status = 'full time';
        user.isDeleted = false;
        await user.save();

        res.json({ msg: 'User marked as Active', user });
    } catch (err) {
        console.error('Restore Error:', err.message);
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
// @route   PUT api/auth/users/:id/card-visibility
// @desc    Update hidden card visibility state for an employee
// @access  Private (HR Admin)
router.put('/users/:id/card-visibility', auth, async (req, res) => {
    try {
        const { hiddenProfileCards, hiddenCareerCards } = req.body;
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        if (hiddenProfileCards !== undefined) {
            targetUser.hiddenProfileCards = hiddenProfileCards;
        }
        if (hiddenCareerCards !== undefined) {
            targetUser.hiddenCareerCards = hiddenCareerCards;
        }

        await targetUser.save();
        res.json({
            msg: 'Card visibility updated successfully',
            hiddenProfileCards: targetUser.hiddenProfileCards,
            hiddenCareerCards: targetUser.hiddenCareerCards
        });
    } catch (err) {
        console.error('Error updating card visibility:', err);
        res.status(500).json({ msg: 'Server Error updating card visibility', error: err.message });
    }
});

// @route   POST api/auth/change-first-password
// @desc    Change password on first login
// @access  Private
router.post('/change-first-password', auth, async (req, res) => {
    let { currentPassword, newPassword, confirmPassword } = req.body;
    if (currentPassword) currentPassword = currentPassword.trim();
    if (newPassword) newPassword = newPassword.trim();
    if (confirmPassword) confirmPassword = confirmPassword.trim();

    try {
        const user = await User.findById(req.user.id);
        if (!user || user.isDeleted) {
            return res.status(404).json({ msg: 'User account not found' });
        }

        if (!currentPassword) {
            return res.status(400).json({ msg: 'Please enter your current password' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({ msg: 'New password must be different from the current password' });
        }

        if (!newPassword || newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters long and include both letters and numbers' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ msg: 'New password and confirm password do not match' });
        }

        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        const cleanUser = await User.findById(user._id).select('-password');
        res.json({
            msg: 'Password updated successfully.',
            user: cleanUser
        });
    } catch (err) {
        console.error('Error updating first login password:', err);
        res.status(500).json({ msg: 'Server error updating password', error: err.message });
    }
});

module.exports = router;