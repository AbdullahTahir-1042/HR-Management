const User = require('../models/User');
const Increment = require('../models/Increment');

/**
 * Automatically checks and applies any approved increments whose date has arrived/passed.
 * @param {string} employeeId - The MongoDB ID of the employee
 */
const syncDueIncrements = async (employeeId) => {
    try {
        const today = new Date();
        // Construct today's local date at UTC midnight for timezone independence
        const todayDoc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

        // Find the latest Approved increment for this employee whose date is <= todayDoc
        const latestApproved = await Increment.findOne({
            employee: employeeId,
            status: 'Approved',
            incrementDate: { $lte: todayDoc }
        }).sort({ incrementDate: -1, createdAt: -1 });

        if (latestApproved) {
            const emp = await User.findById(employeeId);
            if (emp) {
                let updated = false;
                if (emp.salary !== latestApproved.newSalary) {
                    emp.salary = latestApproved.newSalary;
                    updated = true;
                }
                if (latestApproved.promotionRank && emp.promotionRank !== latestApproved.promotionRank) {
                    emp.promotionRank = latestApproved.promotionRank;
                    updated = true;
                }
                if (updated) {
                    await emp.save();
                }
            }
        }
    } catch (err) {
        console.error('Error in syncDueIncrements helper:', err);
    }
};

module.exports = { syncDueIncrements };
