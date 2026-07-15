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

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        await seedLeaveTypes();
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
