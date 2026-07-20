const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const seedLeaveTypes = async () => {
    try {
        const LeaveType = require('./models/LeaveType');
        const LeaveRequest = require('./models/LeaveRequest');

        // Check if we have any leave types
        const count = await LeaveType.countDocuments();
        let defaultLeaveType = null;
        if (count === 0) {
            console.log('Seeding default leave types...');
            const defaults = [
                { name: 'Annual Leave', quota: 20, description: 'Yearly vacation leaves' },
                { name: 'Sick Leave', quota: 10, description: 'Paid sick leaves for health recovery' },
                { name: 'Casual Leave', quota: 10, description: 'Personal/casual leaves for urgent matters' }
            ];
            const seeded = await LeaveType.insertMany(defaults);
            defaultLeaveType = seeded.find(t => t.name === 'Annual Leave');
            console.log('Default leave types seeded successfully.');
        } else {
            defaultLeaveType = await LeaveType.findOne({ name: 'Annual Leave' });
        }

        // Migrate any old leave requests that don't have a leaveType
        if (defaultLeaveType) {
            const result = await LeaveRequest.updateMany(
                { leaveType: { $exists: false } },
                { $set: { leaveType: defaultLeaveType._id } }
            );
            if (result.modifiedCount > 0) {
                console.log(`Migrated ${result.modifiedCount} legacy leave requests to use "${defaultLeaveType.name}".`);
            }
        }
    } catch (error) {
        console.error('Error seeding/migrating leave types:', error.message);
    }
};

const cleanupDepartmentMembers = async () => {
    try {
        const User = require('./models/User');
        const Department = require('./models/Department');

        console.log('Running department membership cleanup...');

        const departments = await Department.find({ isDeleted: false });
        const users = await User.find({ isHR: false }); // only regular employees

        // Step 1: Ensure each user is only in their correct department's employees array
        for (const user of users) {
            const correctDeptId = user.departmentId;
            
            // Remove user from any department where the ID is not correctDeptId
            await Department.updateMany(
                { _id: { $ne: correctDeptId } },
                { $pull: { employees: user._id } }
            );

            // Add user to their correct department if not already present
            if (correctDeptId) {
                await Department.findByIdAndUpdate(
                    correctDeptId,
                    { $addToSet: { employees: user._id } }
                );
            }
        }

        // Step 2: Remove any non-existent user IDs or deleted/HR user IDs from all departments' employees array
        const activeTeamLeads = new Set();
        for (const dept of departments) {
            const activeMemberIds = [];
            for (const memberId of dept.employees || []) {
                const user = await User.findById(memberId);
                if (user && !user.isHR && user.departmentId && user.departmentId.toString() === dept._id.toString()) {
                    activeMemberIds.push(memberId);
                }
            }
            // Update the department's employees list to only contain verified active members
            dept.employees = activeMemberIds;

            // Step 3: Validate team lead reference
            if (dept.teamLead) {
                const leadUser = await User.findById(dept.teamLead);
                if (leadUser && !leadUser.isHR && leadUser.departmentId && leadUser.departmentId.toString() === dept._id.toString()) {
                    activeTeamLeads.add(leadUser._id.toString());
                } else {
                    dept.teamLead = null;
                }
            }
            await dept.save();
        }

        // Step 4: Ensure user isTeamLead flag matches their active department lead status
        for (const user of users) {
            const isActualLead = activeTeamLeads.has(user._id.toString());
            if (user.isTeamLead !== isActualLead) {
                user.isTeamLead = isActualLead;
                await user.save();
            }
        }

        console.log('Department membership cleanup completed successfully.');
    } catch (error) {
        console.error('Error during department membership cleanup:', error.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        await seedLeaveTypes();
        await cleanupDepartmentMembers();
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
