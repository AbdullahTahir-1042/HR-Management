/**
 * Script to create System HR Admin and convert Fahad Tufail & Ayan Tufail to Employee role.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        const managementDept = await Department.findOne({ name: 'Management' });

        // 1. Create or update System HR Admin
        let adminHr = await User.findOne({ email: 'admin@company.com' });
        if (!adminHr) {
            adminHr = new User({
                name: 'System HR Admin',
                email: 'admin@company.com',
                password: 'Office@12345',
                role: 'hr',
                status: 'full time',
                joiningStatus: 'Fresh Join',
                promotionRank: 'Manager',
                salary: 600000,
                department: 'Management',
                departmentId: managementDept ? managementDept._id : null,
                reportingTo: '',
                phone: '03000000000',
                isTeamLead: true,
                isFirstLogin: false
            });
            await adminHr.save();
            console.log('✅ Created System HR Admin (admin@company.com / Office@12345)');
        } else {
            adminHr.role = 'hr';
            await adminHr.save();
            console.log('✅ System HR Admin active:', adminHr.email);
        }

        if (managementDept) {
            await Department.findByIdAndUpdate(managementDept._id, {
                $addToSet: { employees: adminHr._id },
                teamLead: adminHr._id
            });
        }

        // 2. Convert Fahad Tufail to Employee
        const fahad = await User.findOneAndUpdate(
            { email: 'fahadtufail873@gmail.com' },
            { role: 'employee', isTeamLead: false, reportingTo: 'System HR Admin' },
            { new: true }
        );
        console.log('✅ Updated Fahad Tufail role:', fahad?.role, '| Reports to:', fahad?.reportingTo);

        // 3. Convert Ayan Tufail to Employee
        const ayan = await User.findOneAndUpdate(
            { email: 'ayantufail1@gmail.com' },
            { role: 'employee', isTeamLead: false, reportingTo: 'Fahad Tufail' },
            { new: true }
        );
        console.log('✅ Updated Ayan Tufail role:', ayan?.role, '| Reports to:', ayan?.reportingTo);

        console.log('\n🎉 HR Admin created and Fahad & Ayan converted to Employee role successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating roles:', err);
        process.exit(1);
    }
};

run();
