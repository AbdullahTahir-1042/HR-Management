const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const Holiday = require('../models/Holiday');
const OfficeSchedule = require('../models/OfficeSchedule');

// Run every day at 11:55 PM
const startCronJobs = () => {
    console.log('✅ Attendance Cron Scheduled (11:55 PM)');
    cron.schedule('55 23 * * *', async () => {
        try {
            console.log('\n⏰ Running Daily Attendance Check...');
            const todayDateObj = new Date();

            // Fetch the default office schedule to determine working days
            const defaultSchedule = await OfficeSchedule.findOne({ isDefault: true });
            const workingDays = defaultSchedule ? defaultSchedule.workingDays : [1, 2, 3, 4, 5]; // Default Mon-Fri

            // Skip Non-Working Days
            const currentDayOfWeek = todayDateObj.getDay();
            if (!workingDays.includes(currentDayOfWeek)) {
                console.log(`Skipping attendance check because today (Day ${currentDayOfWeek}) is a non-working day.`);
                return;
            }

            // Get today's date in YYYY-MM-DD for attendance
            const year = todayDateObj.getFullYear();
            const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(todayDateObj.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            
            // Check if today is a Holiday
            const holiday = await Holiday.findOne({
                startDate: { $lte: todayStr },
                endDate: { $gte: todayStr }
            });

            if (holiday) {
                console.log(`Skipping attendance check because today is a Holiday: ${holiday.name}`);
                return;
            }

            // Fetch all active employees
            const activeEmployees = await User.find({ status: { $ne: 'Inactive' } });

            for (const employee of activeEmployees) {
                console.log(`\nChecking Employee:\n- ${employee.name}\n- ${employee.email}`);
                // Check if they checked in today
                const attendance = await Attendance.findOne({ employee: employee._id, date: todayStr });
                
                if (attendance && attendance.status === 'absent') {
                    console.log('✓ Already Marked Absent Today');
                    continue; // Skip, already processed absence for today
                }

                if (!attendance || !attendance.checkIn) {
                    console.log('✗ Attendance Not Found');
                    // Check for approved leave
                    // A leave covers today if startDate <= today && endDate >= today
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    
                    const endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);

                    const leave = await LeaveRequest.findOne({
                        employee: employee._id,
                        status: 'approved',
                        startDate: { $lte: endOfDay },
                        endDate: { $gte: startOfDay }
                    });

                    if (!leave) {
                        console.log('✗ No Approved Leave');
                        // Missing work without leave
                        if (!employee.hasReceivedAbsenceWarning) {
                            // First time: Send warning
                            await Notification.create({
                                recipient: employee._id,
                                title: 'Absence Warning',
                                message: 'You missed your check-in today without an approved leave. Please note that subsequent unapproved absences will result in a salary deduction.',
                                type: 'system'
                            });

                            // Notify HR
                            const hrAdmins = await User.find({ role: { $in: ['hr', 'admin'] } });
                            for (const hr of hrAdmins) {
                                await Notification.create({
                                    recipient: hr._id,
                                    title: 'Absence Warning Issued',
                                    message: `${employee.name} was issued their first absence warning for missing check-in today.`,
                                    type: 'system'
                                });
                            }

                            employee.hasReceivedAbsenceWarning = true;
                            await employee.save();
                            console.log('• Warning Created');
                            console.log('• Notification Sent');
                        } else {
                            console.log('• Already Warned Before');
                            // Subsequent absence: Mark absent and deduct salary
                            
                            // Mark absent
                            await Attendance.findOneAndUpdate(
                                { employee: employee._id, date: todayStr },
                                { 
                                    status: 'absent',
                                    reason: 'Automatic absence due to missing check-in without approved leave.'
                                },
                                { upsert: true, new: true }
                            );
                            console.log('• Marked Absent');

                            // Deduct salary: deduct 1 day's worth (assuming salary is monthly)
                            const currentSalary = employee.salary || 0;
                            const deductionAmount = currentSalary > 0 ? Math.floor(currentSalary / 30) : 0;
                            
                            // Instead of modifying employee.salary, create a PayrollDeduction record
                            const PayrollDeduction = require('../models/PayrollDeduction');
                            const payrollMonth = todayStr.slice(0, 7); // e.g., '2026-08'
                            
                            await PayrollDeduction.create({
                                employee: employee._id,
                                date: new Date(),
                                amount: deductionAmount,
                                reason: 'Unapproved Absence',
                                payrollMonth: payrollMonth
                            });
                            
                            console.log('• Salary Deducted');

                            // Notify them of the deduction
                            await Notification.create({
                                recipient: employee._id,
                                title: 'Salary Deducted due to Absence',
                                message: `You missed your check-in again without approved leave. As per policy, you have been marked absent and a payroll deduction of Rs. ${deductionAmount} has been recorded.`,
                                type: 'system'
                            });

                            // Notify HR
                            const hrAdmins = await User.find({ role: { $in: ['hr', 'admin'] } });
                            for (const hr of hrAdmins) {
                                await Notification.create({
                                    recipient: hr._id,
                                    title: 'Automated Absence & Deduction',
                                    message: `${employee.name} was automatically marked absent and a payroll deduction of Rs. ${deductionAmount} was applied.`,
                                    type: 'system'
                                });
                            }
                            console.log('• Notification Sent');
                        }
                    } else {
                        console.log('✓ Approved Leave Found');
                        console.log('Skipping Employee - Reason: On Approved Leave');
                    }
                } else if (!attendance.checkOut) {
                    console.log('! Missing Check-Out');
                    // Mark as completely absent due to missing checkout
                    // However, we should also calculate exactly when they should have checked out just in case
                    const expectedEndStr = attendance.expectedCheckOut || '19:00';
                    const [endHour, endMin] = expectedEndStr.split(':').map(Number);
                    
                    attendance.status = 'absent';
                    attendance.reason = attendance.reason ? attendance.reason + ' | Automatic absence due to missing manual check-out (Expected: ' + expectedEndStr + ').' : 'Automatic absence due to missing manual check-out (Expected: ' + expectedEndStr + ').';
                    await attendance.save();
                    console.log('• Marked Absent due to missing check-out');
                } else {
                    console.log('✓ Attendance Complete');
                    console.log('Skipping Employee - Reason: Checked In and Out');
                }
            }
            console.log('\nDaily absence check completed.');
        } catch (error) {
            console.error('Error in daily absence check cron job:', error);
        }
    });
};

module.exports = { startCronJobs };
