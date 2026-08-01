/**
 * Clean Database Reset & Organization Onboarding Script
 * 
 * Objectives:
 * 1. Remove all old user and employee records.
 * 2. Clean up associated attendance, leave, announcement, and messaging data to avoid orphan references.
 * 3. Seed exact new organization hierarchy:
 *    - CEO/Senior HR: Fahad Tufail
 *    - Second HR: Ayan Tufail
 *    - Employees: Huzaifa, Saad Jamil, Abdullah Tahir, Laiba Ajmal, Rahmeen Fatima, Tahseen Fatima, Abdullah Hasiff
 * 4. Assign valid departments, salaries, phones, emails, and initial passwords (Office@12345).
 * 5. Set isFirstLogin = true for mandatory first-time password update.
 * 
 * Usage: node scripts/resetAndInitializeOrg.js (from backend/ directory)
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcements');
const HRRequest = require('../models/HRRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const INITIAL_PASSWORD = 'Office@12345';

const DEPARTMENTS_DATA = [
    { name: 'Management', description: 'Executive Leadership and Human Resources' },
    { name: 'AI Engineering', description: 'Artificial Intelligence and Machine Learning' },
    { name: 'Full-Stack Development', description: 'Full-Stack Web & Application Engineering' },
    { name: 'Design', description: 'UI/UX & Product Design' }
];

const ORG_HIERARCHY = [
    // ── Leadership / HR ──
    {
        name: 'System HR Admin',
        email: 'admin@company.com',
        phone: '03000000000',
        role: 'hr',
        department: 'Management',
        reportingTo: '',
        salary: 600000,
        promotionRank: 'Manager',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Fahad Tufail',
        email: 'fahadtufail873@gmail.com',
        phone: '03259173194',
        role: 'employee',
        department: 'Management',
        reportingTo: 'System HR Admin',
        salary: 500000,
        promotionRank: 'Manager',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Ayan Tufail',
        email: 'ayantufail1@gmail.com',
        phone: '03080068800',
        role: 'employee',
        department: 'Management',
        reportingTo: 'Fahad Tufail',
        salary: 300000,
        promotionRank: 'Lead',
        joiningStatus: 'Fresh Join'
    },

    // ── Employees (Reporting to Ayan Tufail) ──
    {
        name: 'Huzaifa',
        email: 'huzaifaras10@gmail.com',
        phone: '03107164892',
        role: 'employee',
        department: 'AI Engineering',
        reportingTo: 'Ayan Tufail',
        salary: 180000,
        promotionRank: 'Senior',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Saad Jamil',
        email: 'saadjamil504@gmail.com',
        phone: '03010779759',
        role: 'employee',
        department: 'AI Engineering',
        reportingTo: 'Ayan Tufail',
        salary: 180000,
        promotionRank: 'Senior',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Abdullah Tahir',
        email: 'tahirabdullah587@gmail.com',
        phone: '03064639185',
        role: 'employee',
        department: 'Full-Stack Development',
        reportingTo: 'Ayan Tufail',
        salary: 170000,
        promotionRank: 'Mid-Level',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Laiba Ajmal',
        email: 'farhanrashid938@gmail.com',
        phone: '03451234567',
        role: 'employee',
        department: 'AI Engineering',
        reportingTo: 'Ayan Tufail',
        salary: 160000,
        promotionRank: 'Mid-Level',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Rahmeen Fatima',
        email: 'rahmeenfatima009@gmail.com',
        phone: '03009876543',
        role: 'employee',
        department: 'Full-Stack Development',
        reportingTo: 'Ayan Tufail',
        salary: 170000,
        promotionRank: 'Mid-Level',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Tahseen Fatima',
        email: 'tahseenfatima.design@gmail.com',
        phone: '03123456789',
        role: 'employee',
        department: 'Design',
        reportingTo: 'Ayan Tufail',
        salary: 150000,
        promotionRank: 'Junior',
        joiningStatus: 'Fresh Join'
    },
    {
        name: 'Abdullah Hasiff',
        email: 'abdullahhasiff15@gmail.com',
        phone: '03334567890',
        role: 'employee',
        department: 'Full-Stack Development',
        reportingTo: 'Ayan Tufail',
        salary: 170000,
        promotionRank: 'Mid-Level',
        joiningStatus: 'Fresh Join'
    }
];

const runReset = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        // 1. Clear existing database collections
        console.log('\n🧹 Clearing old database records...');
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await LeaveRequest.deleteMany({});
        await HRRequest.deleteMany({});
        await Conversation.deleteMany({});
        await Message.deleteMany({});
        await Department.deleteMany({});
        console.log('✅ Old users, attendance, leaves, HR requests, messages, and departments cleared.');

        // 2. Create Departments
        console.log('\n🏢 Initializing Departments...');
        const deptMap = {};
        for (const d of DEPARTMENTS_DATA) {
            const dept = new Department({
                name: d.name,
                description: d.description,
                employees: []
            });
            await dept.save();
            deptMap[d.name] = dept;
            console.log(`   - Created Department: ${d.name}`);
        }

        // 3. Create Users & HR Accounts
        console.log('\n👥 Creating New Organization Accounts...');
        const createdUsers = [];

        for (const person of ORG_HIERARCHY) {
            const deptObj = deptMap[person.department];

            const newUser = new User({
                name: person.name,
                email: person.email.toLowerCase(),
                password: INITIAL_PASSWORD,
                role: person.role,
                status: 'full time',
                joiningStatus: person.joiningStatus || 'Fresh Join',
                promotionRank: person.promotionRank || 'Junior',
                salary: person.salary,
                department: person.department,
                departmentId: deptObj ? deptObj._id : null,
                reportingTo: person.reportingTo,
                phone: person.phone,
                isTeamLead: person.name === 'Ayan Tufail' || person.name === 'Fahad Tufail',
                isFirstLogin: true,
                isDeleted: false
            });

            await newUser.save();
            createdUsers.push(newUser);

            if (deptObj) {
                await Department.findByIdAndUpdate(deptObj._id, {
                    $addToSet: { employees: newUser._id }
                });
                if (newUser.isTeamLead && !deptObj.teamLead) {
                    deptObj.teamLead = newUser._id;
                    await deptObj.save();
                }
            }

            console.log(`   - Created ${person.role.toUpperCase()}: ${person.name} (${person.email}) | Dept: ${person.department} | Reports To: ${person.reportingTo || 'None'}`);
        }

        // 4. Summary Verification
        console.log('\n=========================================');
        console.log('🎉 ORGANIZATION INITIALIZATION COMPLETE');
        console.log('=========================================');
        console.log(`Total Accounts Created: ${createdUsers.length}`);
        console.log(`Default Initial Password: ${INITIAL_PASSWORD}`);
        console.log(`First-Time Login Forced: YES (isFirstLogin = true)`);
        console.log('\nHierarchy Overview:');
        console.log('Fahad Tufail (Senior HR / CEO)');
        console.log('  └── Ayan Tufail (HR)');
        console.log('        ├── Huzaifa (AI Engineering)');
        console.log('        ├── Saad Jamil (AI Engineering)');
        console.log('        ├── Abdullah Tahir (Full-Stack Development)');
        console.log('        ├── Laiba Ajmal (AI Engineering)');
        console.log('        ├── Rahmeen Fatima (Full-Stack Development)');
        console.log('        ├── Tahseen Fatima (Design)');
        console.log('        └── Abdullah Hasiff (Full-Stack Development)');
        console.log('=========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error during organization initialization:', err);
        process.exit(1);
    }
};

runReset();
