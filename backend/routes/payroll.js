const express = require('express');
const router = express.Router();
const PayrollDeduction = require('../models/PayrollDeduction');

// @route   GET /api/payroll/deductions
// @desc    Get all payroll deductions (with optional employeeId or payrollMonth filters)
router.get('/deductions', async (req, res) => {
    try {
        const { employeeId, payrollMonth } = req.query;
        let query = {};
        
        if (employeeId) {
            query.employee = employeeId;
        }
        if (payrollMonth) {
            query.payrollMonth = payrollMonth;
        }

        const deductions = await PayrollDeduction.find(query).populate('employee', 'name email department');
        res.status(200).json(deductions);
    } catch (error) {
        console.error('Error fetching payroll deductions:', error);
        res.status(500).json({ message: 'Server error fetching deductions' });
    }
});

module.exports = router;
