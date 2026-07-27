// Reset & Dummy-Data Seed Script
// Clears all data EXCEPT hr users, then re-seeds fresh test data.
// Usage: cd backend && node scripts/resetAndSeed.js

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcements');
const HRRequest = require('../models/HRRequest');
const OnboardingTask = require('../models/OnboardingTask');

const PASSWORD = 'Test@12345';

const DEPARTMENTS = [
    { name: 'Engineering',     description: 'Software engineers and developers' },
    { name: 'Design',          description: 'UI/UX and product designers' },
    { name: 'Marketing',       description: 'Marketing and growth team' },
    { name: 'Human Resources', description: 'HR and people operations' },
];

const DUMMY_EMPLOYEES = [
    { name: 'Alice Johnson',  email: 'alice.johnson@demo.com',  role: 'employee', department: 'Engineering',     status: 'full time',  salary: 180000, reportingTo: 'Bob Smith' },
    { name: 'Bob Smith',      email: 'bob.smith@demo.com',      role: 'employee', department: 'Engineering',     status: 'full time',  salary: 220000, reportingTo: '' },
    { name: 'Carol Williams', email: 'carol.williams@demo.com', role: 'employee', department: 'Design',          status: 'full time',  salary: 160000, reportingTo: 'Bob Smith' },
    { name: 'David Lee',      email: 'david.lee@demo.com',      role: 'employee', department: 'Marketing',       status: 'probation',  salary: 130000, reportingTo: 'Bob Smith' },
    { name: 'Emma Davis',     email: 'emma.davis@demo.com',     role: 'employee', department: 'Engineering',     status: 'full time',  salary: 175000, reportingTo: 'Bob Smith' },
    { name: 'Frank Miller',   email: 'frank.miller@demo.com',   role: 'employee', department: 'Design',          status: 'internship', salary:  60000, reportingTo: 'Carol Williams' },
    { name: 'Grace Wilson',   email: 'grace.wilson@demo.com',   role: 'employee', department: 'Marketing',       status: 'full time',  salary: 145000, reportingTo: 'Bob Smith' },
    { name: 'Henry Brown',    email: 'henry.brown@demo.com',    role: 'employee', department: 'Engineering',     status: 'full time',  salary: 190000, reportingTo: 'Bob Smith' },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);

const lastNWeekdays = (n) => {
    const days = [];
    const cursor = new Date();
    while (days.length < n) {
        cursor.setDate(cursor.getDate() - 1);
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    }
    return days.reverse();
};

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    // 1. Clear all non-user collections
    console.log('Clearing old data...');
    await Attendance.deleteMany({});
    await LeaveRequest.deleteMany({});
    await LeaveType.deleteMany({});
    await Holiday.deleteMany({});
    await Announcement.deleteMany({});
    await HRRequest.deleteMany({});
    await OnboardingTask.deleteMany({});
    await Department.deleteMany({});
    console.log('  Cleared: Attendance, LeaveRequests, LeaveTypes, Holidays, Announcements, HRRequests, OnboardingTasks, Departments');

    // 2. Remove old dummy employees (emails ending in @demo.com) only
    const del = await User.deleteMany({ email: /^.+@demo\.com$/ });
    console.log('  Removed ' + del.deletedCount + ' old dummy employee(s).');
    console.log('  HR accounts preserved.\n');

    // 3. Seed Departments
    console.log('Creating departments...');
    const deptByName = {};
    for (const d of DEPARTMENTS) {
        const dept = await Department.create(d);
        deptByName[d.name] = dept;
        console.log('  + ' + d.name);
    }

    // 4. Seed dummy employees
    console.log('\nCreating dummy employees...');
    const userByEmail = {};
    for (const p of DUMMY_EMPLOYEES) {
        const dept = deptByName[p.department];
        const user = new User({
            name: p.name, email: p.email, password: PASSWORD,
            role: p.role, status: p.status,
            department: p.department, departmentId: dept ? dept._id : null,
            reportingTo: p.reportingTo, salary: p.salary, leaveBalance: 40,
        });
        await user.save();
        userByEmail[p.email] = user;
        if (dept) { dept.employees.push(user._id); await dept.save(); }
        console.log('  + ' + p.name + ' <' + p.email + '> (' + p.status + ')');
    }

    // Set Bob as team lead
    const bob = userByEmail['bob.smith@demo.com'];
    const eng = deptByName['Engineering'];
    if (bob && eng) {
        eng.teamLead = bob._id; await eng.save();
        bob.isTeamLead = true; await bob.save();
        console.log('  Bob Smith set as Engineering team lead.');
    }

    // 5. Seed Leave Types
    console.log('\nSeeding leave types...');
    const ltDefs = [
        { name: 'Annual Leave',    quota: 20, description: 'Yearly vacation leaves' },
        { name: 'Sick Leave',      quota: 10, description: 'Paid sick leaves' },
        { name: 'Casual Leave',    quota: 10, description: 'Personal/casual leaves' },
        { name: 'Maternity Leave', quota: 90, description: 'Maternity leave' },
    ];
    const ltByName = {};
    for (const lt of ltDefs) {
        ltByName[lt.name] = await LeaveType.create(lt);
        console.log('  + ' + lt.name);
    }

    // 6. Seed Attendance (last 10 weekdays)
    console.log('\nSeeding attendance...');
    const days = lastNWeekdays(10);
    let attCount = 0;
    for (const p of DUMMY_EMPLOYEES) {
        const user = userByEmail[p.email];
        for (const day of days) {
            if (Math.random() < 0.15) continue;
            const isLate = Math.random() < 0.25;
            const ci = new Date(day); ci.setHours(isLate ? 9 : 8, randomBetween(0, isLate ? 45 : 55), 0, 0);
            const co = new Date(day); co.setHours(17, randomBetween(30, 59), 0, 0);
            await Attendance.create({ employee: user._id, date: toDateStr(day), checkIn: ci, checkOut: co });
            attCount++;
        }
    }
    console.log('  ' + attCount + ' attendance records created.');

    // 7. Seed Leave Requests
    console.log('\nSeeding leave requests...');
    const leaveDefs = [
        { email: 'alice.johnson@demo.com',  lt: 'Annual Leave',  days: 3, offset: 7,   reason: 'Family vacation',            status: 'pending'  },
        { email: 'carol.williams@demo.com', lt: 'Sick Leave',    days: 2, offset: -3,  reason: 'High fever and flu',          status: 'approved' },
        { email: 'david.lee@demo.com',      lt: 'Casual Leave',  days: 1, offset: 2,   reason: 'Personal appointment',        status: 'pending'  },
        { email: 'emma.davis@demo.com',     lt: 'Annual Leave',  days: 5, offset: 14,  reason: 'Overseas trip',               status: 'approved' },
        { email: 'frank.miller@demo.com',   lt: 'Casual Leave',  days: 1, offset: -7,  reason: 'Vehicle breakdown',           status: 'rejected' },
        { email: 'grace.wilson@demo.com',   lt: 'Sick Leave',    days: 2, offset: -1,  reason: 'Stomach infection',           status: 'approved' },
        { email: 'henry.brown@demo.com',    lt: 'Annual Leave',  days: 4, offset: 20,  reason: 'Wedding anniversary trip',    status: 'pending'  },
        { email: 'bob.smith@demo.com',      lt: 'Casual Leave',  days: 1, offset: 5,   reason: 'Home inspection appointment', status: 'approved' },
    ];
    let leaveCount = 0;
    for (const l of leaveDefs) {
        const user = userByEmail[l.email]; const lt = ltByName[l.lt];
        if (!user || !lt) continue;
        const start = new Date(); start.setDate(start.getDate() + l.offset);
        const end = new Date(start); end.setDate(end.getDate() + l.days - 1);
        await LeaveRequest.create({ employee: user._id, leaveType: lt._id, startDate: start, endDate: end, reason: l.reason, status: l.status });
        leaveCount++;
    }
    console.log('  ' + leaveCount + ' leave requests created.');

    // 8. Seed HR Requests
    console.log('\nSeeding HR requests...');
    const hrDefs = [
        { email: 'alice.johnson@demo.com',  type: 'Salary Slip',          desc: 'Need my salary slip for May for a bank loan.', status: 'Pending' },
        { email: 'bob.smith@demo.com',      type: 'Work From Home',        desc: 'Requesting WFH for next Monday - router installation.', status: 'In Review' },
        { email: 'carol.williams@demo.com', type: 'Attendance Correction', desc: 'Forgot to check out on July 18, I left at 6:45 PM.', status: 'Resolved', hrNote: 'Verified via CCTV. Attendance corrected.' },
        { email: 'david.lee@demo.com',      type: 'Experience Letter',     desc: 'Need an experience letter for a visa application.', status: 'Pending' },
        { email: 'emma.davis@demo.com',     type: 'Other',                 desc: 'How do I update my emergency contact information?', status: 'Pending' },
        { email: 'frank.miller@demo.com',   type: 'Work From Home',        desc: 'Would like to work remotely this Thursday.', status: 'Rejected', hrNote: 'Interns are required on-site. Please come in.' },
        { email: 'grace.wilson@demo.com',   type: 'Salary Slip',           desc: 'Requesting salary slips for the last 3 months.', status: 'Resolved', hrNote: 'Slips sent to your registered email.' },
        { email: 'henry.brown@demo.com',    type: 'Attendance Correction', desc: 'Missed check-in on July 22 due to a system error.', status: 'In Review' },
    ];
    let hrCount = 0;
    for (const r of hrDefs) {
        const user = userByEmail[r.email]; if (!user) continue;
        await HRRequest.create({ employee: user._id, type: r.type, description: r.desc, status: r.status, hrNote: r.hrNote || '' });
        hrCount++;
    }
    console.log('  ' + hrCount + ' HR requests created.');

    // 9. Seed Onboarding Tasks
    console.log('\nSeeding onboarding tasks...');
    const onDefs = [
        { title: 'Complete company laptop setup',          desc: 'Install dev tools, VPN, and configure work email.',                         cat: 'IT Setup',   done: ['alice.johnson@demo.com','bob.smith@demo.com','carol.williams@demo.com','emma.davis@demo.com','henry.brown@demo.com'] },
        { title: 'Sign employment contract',               desc: 'Review and digitally sign your contract via the HR portal.',                  cat: 'Paperwork',  done: ['alice.johnson@demo.com','bob.smith@demo.com','carol.williams@demo.com','david.lee@demo.com','emma.davis@demo.com','grace.wilson@demo.com','henry.brown@demo.com'] },
        { title: 'Attend company orientation',             desc: 'Join the new-hire orientation session hosted by HR.',                         cat: 'General',    done: ['alice.johnson@demo.com','bob.smith@demo.com','carol.williams@demo.com'] },
        { title: 'Complete security & compliance training',desc: 'Watch the security video and pass the quiz.',                                 cat: 'Training',   done: ['alice.johnson@demo.com','emma.davis@demo.com'] },
        { title: 'Set up direct deposit for salary',       desc: 'Submit your bank account details to HR for salary disbursement.',             cat: 'Paperwork',  done: ['alice.johnson@demo.com','bob.smith@demo.com','henry.brown@demo.com'] },
        { title: 'Meet your team lead',                    desc: 'Schedule a 1-on-1 intro meeting with your direct manager.',                   cat: 'General',    done: ['alice.johnson@demo.com','carol.williams@demo.com','emma.davis@demo.com'] },
    ];
    let onCount = 0;
    for (const t of onDefs) {
        await OnboardingTask.create({ title: t.title, description: t.desc, category: t.cat, completedBy: t.done.map(e => userByEmail[e]?._id).filter(Boolean) });
        onCount++;
    }
    console.log('  ' + onCount + ' onboarding tasks created.');

    // 10. Seed Holidays
    console.log('\nSeeding holidays...');
    const holDefs = [
        { name: 'Independence Day',        startDate: '2026-08-14', endDate: '2026-08-14', description: 'Pakistan Independence Day',         type: 'public'  },
        { name: 'Eid al-Fitr',             startDate: '2026-03-30', endDate: '2026-04-01', description: 'Eid ul Fitr holidays',              type: 'public'  },
        { name: 'Eid al-Adha',             startDate: '2026-06-06', endDate: '2026-06-08', description: 'Eid ul Adha holidays',              type: 'public'  },
        { name: 'Company Anniversary Day', startDate: '2026-09-01', endDate: '2026-09-01', description: 'Annual company founding celebration',type: 'company' },
        { name: 'Christmas',               startDate: '2026-12-25', endDate: '2026-12-25', description: 'Christmas holiday',                 type: 'public'  },
        { name: 'New Year',                startDate: '2027-01-01', endDate: '2027-01-01', description: 'New Year celebration',              type: 'public'  },
    ];
    let holCount = 0;
    for (const h of holDefs) { await Holiday.create(h); holCount++; }
    console.log('  ' + holCount + ' holidays created.');

    // 11. Seed Announcements
    console.log('\nSeeding announcements...');
    const hrAuthor = await User.findOne({ role: 'hr', isDeleted: false });
    const annDefs = [
        { title: 'Welcome to the HR Portal!',        msg: 'Hello team! The new HR Management portal is now live. Track attendance, submit leaves, and raise HR tickets here.' },
        { title: 'Q3 Performance Reviews Scheduled', msg: 'Q3 performance reviews will be held in the last week of August. Submit your self-assessment forms by August 20th.' },
        { title: 'Office Timings Reminder',          msg: 'Office hours are 9:00 AM - 6:00 PM, Monday to Friday. Late check-ins (after 9:15 AM) will be marked accordingly.' },
        { title: 'Company Picnic - Save the Date!',  msg: 'Annual company picnic is on September 15th! More details on venue and timings coming soon. See you there!' },
    ];
    let annCount = 0;
    for (const a of annDefs) {
        await Announcement.create({ title: a.title, message: a.msg, createdBy: hrAuthor ? hrAuthor._id : null });
        annCount++;
    }
    console.log('  ' + annCount + ' announcements created.');

    console.log('\n----------------------------------------------');
    console.log('Seed complete! Dummy accounts (password: ' + PASSWORD + '):');
    for (const p of DUMMY_EMPLOYEES) {
        console.log('  ' + p.email + '  (' + p.role + ' / ' + p.status + ')');
    }
    console.log('\nHR accounts were NOT modified - use existing HR credentials.');
    console.log('----------------------------------------------\n');

    await mongoose.disconnect();
};

run().catch(err => { console.error('Seed failed:', err); process.exit(1); });
