const express = require('express');
const router = express.Router();
const { auth, isHR } = require('../middleware/auth');
const LoanRequest = require('../models/LoanRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   POST api/loans
// @desc    Submit a new loan request (Employee)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            requestedAmount,
            purpose,
            reason,
            preferredInstallments,
            preferredStartMonth,
            supportingDocument,
            employeeNotes
        } = req.body;

        if (!requestedAmount || !purpose || !reason || !preferredInstallments || !preferredStartMonth) {
            return res.status(400).json({ msg: 'Please provide all required loan fields' });
        }

        // Check if employee already has an active or pending loan
        const existingActiveLoan = await LoanRequest.findOne({
            employee: req.user.id,
            status: { $in: ['Pending', 'Revision Requested', 'Active', 'Approved'] }
        });

        if (existingActiveLoan) {
            return res.status(400).json({
                msg: `You already have a loan with status '${existingActiveLoan.status}'. Concurrent loans are not allowed.`
            });
        }

        const newLoan = new LoanRequest({
            employee: req.user.id,
            requestedAmount: Number(requestedAmount),
            purpose,
            reason,
            preferredInstallments: Number(preferredInstallments),
            preferredStartMonth,
            supportingDocument: supportingDocument || '',
            employeeNotes: employeeNotes || ''
        });

        await newLoan.save();

        // Notify HR users
        try {
            const hrUsers = await User.find({ role: { $regex: /^hr$/i } });
            const employeeUser = await User.findById(req.user.id);
            for (const hr of hrUsers) {
                await Notification.create({
                    recipient: hr._id,
                    type: 'LoanRequest',
                    title: 'New Loan Request Submitted',
                    message: `${employeeUser.name} submitted a loan request for PKR ${requestedAmount.toLocaleString()}.`,
                    relatedId: newLoan._id
                });
            }
        } catch (nErr) {
            console.error('Error creating HR loan notification:', nErr);
        }

        res.status(201).json(newLoan);
    } catch (err) {
        console.error('Error submitting loan request:', err);
        res.status(500).json({ msg: 'Server Error submitting loan request', error: err.message });
    }
});

// @route   GET api/loans/my-loans
// @desc    Get logged-in employee's loan requests
// @access  Private
router.get('/my-loans', auth, async (req, res) => {
    try {
        const loans = await LoanRequest.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        console.error('Error fetching employee loans:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/loans/active/:employeeId
// @desc    Get active loan summary for an employee
// @access  Private
router.get('/active/:employeeId', auth, async (req, res) => {
    try {
        const loan = await LoanRequest.findOne({
            employee: req.params.employeeId,
            status: { $in: ['Active', 'Approved'] }
        }).sort({ createdAt: -1 });

        res.json(loan || null);
    } catch (err) {
        console.error('Error fetching active loan:', err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/loans/all
// @desc    Get all loan requests (HR Only)
// @access  Private (HR)
router.get('/all', [auth, isHR], async (req, res) => {
    try {
        const loans = await LoanRequest.find()
            .populate('employee', 'name email department salary photo promotionRank')
            .populate('hrReviewer', 'name')
            .sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        console.error('Error fetching all loans:', err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/loans/:id/review
// @desc    Approve, Reject, or Request Revision for a loan (HR Only)
// @access  Private (HR)
router.put('/:id/review', [auth, isHR], async (req, res) => {
    try {
        const {
            status,
            approvedAmount,
            approvedInstallments,
            monthlyDeduction,
            repaymentStartMonth,
            hrNotes
        } = req.body;

        const loan = await LoanRequest.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ msg: 'Loan request not found' });
        }

        if (!['Approved', 'Rejected', 'Revision Requested'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid review status' });
        }

        loan.status = status === 'Approved' ? 'Active' : status;
        loan.hrReviewer = req.user.id;
        loan.hrNotes = hrNotes || '';
        loan.reviewedAt = new Date();

        if (status === 'Approved') {
            const finalApproved = Number(approvedAmount) || loan.requestedAmount;
            const finalInstallments = Number(approvedInstallments) || loan.preferredInstallments;
            const calcMonthly = Number(monthlyDeduction) || Math.ceil(finalApproved / finalInstallments);

            loan.approvedAmount = finalApproved;
            loan.approvedInstallments = finalInstallments;
            loan.monthlyDeduction = calcMonthly;
            loan.repaymentStartMonth = repaymentStartMonth || loan.preferredStartMonth;
            loan.remainingBalance = finalApproved;
            loan.paidAmount = 0;

            // Link active loan to User model
            await User.findByIdAndUpdate(loan.employee, { activeLoan: loan._id });
        }

        await loan.save();

        // Notify Employee
        try {
            await Notification.create({
                recipient: loan.employee,
                type: 'LoanRequest',
                title: `Loan Request ${status === 'Approved' ? 'Approved' : status}`,
                message: `Your loan request for PKR ${loan.requestedAmount.toLocaleString()} has been ${status === 'Approved' ? 'approved and activated' : status.toLowerCase()}.`,
                relatedId: loan._id
            });
        } catch (nErr) {
            console.error('Error creating employee loan notification:', nErr);
        }

        res.json(loan);
    } catch (err) {
        console.error('Error reviewing loan request:', err);
        res.status(500).json({ msg: 'Server Error reviewing loan', error: err.message });
    }
});

// @route   PUT api/loans/:id/deduct
// @desc    Process a monthly payroll deduction for an active loan
// @access  Private (HR or System)
router.put('/:id/deduct', auth, async (req, res) => {
    try {
        const { payrollMonth, deductionAmount } = req.body;
        const loan = await LoanRequest.findById(req.params.id);

        if (!loan || loan.status !== 'Active') {
            return res.status(400).json({ msg: 'No active loan found to process deduction' });
        }

        const amountToDeduct = Number(deductionAmount) || loan.monthlyDeduction;
        const newPaid = loan.paidAmount + amountToDeduct;
        const newRemaining = Math.max(0, loan.approvedAmount - newPaid);

        loan.paidAmount = newPaid;
        loan.remainingBalance = newRemaining;

        loan.repaymentLogs.push({
            payrollMonth: payrollMonth || new Date().toISOString().slice(0, 7),
            amountDeducted: amountToDeduct,
            remainingBalanceAfter: newRemaining,
            deductedAt: new Date()
        });

        if (newRemaining === 0) {
            loan.status = 'Completed';
            await User.findByIdAndUpdate(loan.employee, { activeLoan: null });

            try {
                await Notification.create({
                    recipient: loan.employee,
                    type: 'LoanRequest',
                    title: 'Loan Fully Repaid!',
                    message: `Congratulations! Your loan of PKR ${loan.approvedAmount.toLocaleString()} has been fully settled.`,
                    relatedId: loan._id
                });
            } catch (nErr) {}
        }

        await loan.save();
        res.json(loan);
    } catch (err) {
        console.error('Error processing loan deduction:', err);
        res.status(500).json({ msg: 'Server Error processing deduction', error: err.message });
    }
});

// @route   DELETE api/loans/:id
// @desc    Cancel a pending loan request
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const loan = await LoanRequest.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ msg: 'Loan request not found' });
        }

        if (loan.employee.toString() !== req.user.id && req.user.role?.toLowerCase() !== 'hr') {
            return res.status(403).json({ msg: 'Unauthorized to cancel this loan request' });
        }

        if (loan.status === 'Active' || loan.status === 'Completed') {
            return res.status(400).json({ msg: 'Cannot cancel an active or completed loan' });
        }

        loan.status = 'Cancelled';
        await loan.save();

        res.json({ msg: 'Loan request cancelled successfully', loan });
    } catch (err) {
        console.error('Error cancelling loan request:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
