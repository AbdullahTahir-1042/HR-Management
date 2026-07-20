// One-off local dev seed script for TDC mock company data.
// Usage: cd backend && node scripts/seedMockData.js
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

const PASSWORD = 'Tdc@12345';

const DEPARTMENTS = [
    { name: 'Management', description: 'Founders and leadership' },
    { name: 'AI Engineering', description: 'AI/ML engineers' },
    { name: 'Full-Stack Development', description: 'Full-stack product engineers' },
    { name: 'Design', description: 'UI/UX design' },
];

const PEOPLE = [
    { name: 'Fahad Tufail', email: 'fahad.tufail@tdc.com', role: 'hr', department: 'Management', reportingTo: '', salary: 500000 },
    { name: 'Ayan Tufail', email: 'ayan.tufail@tdc.com', role: 'hr', department: 'Management', reportingTo: 'Fahad Tufail', salary: 300000 },
    { name: 'Huzaifa', email: 'huzaifa@tdc.com', role: 'employee', department: 'AI Engineering', reportingTo: 'Ayan Tufail', salary: 180000 },
    { name: 'Saad Jamil', email: 'saad.jamil@tdc.com', role: 'employee', department: 'AI Engineering', reportingTo: 'Ayan Tufail', salary: 180000 },
    { name: 'Abdullah Tahir', email: 'abdullah.tahir@tdc.com', role: 'employee', department: 'Full-Stack Development', reportingTo: 'Ayan Tufail', salary: 170000 },
    { name: 'Laiba Ajmal', email: 'laiba.ajmal@tdc.com', role: 'employee', department: 'AI Engineering', reportingTo: 'Ayan Tufail', salary: 160000 },
    { name: 'Rahmeen Fatima', email: 'rahmeen.fatima@tdc.com', role: 'employee', department: 'Full-Stack Development', reportingTo: 'Ayan Tufail', salary: 170000 },
    { name: 'Tahseen Fatima', email: 'tahseen.fatima@tdc.com', role: 'employee', department: 'Design', reportingTo: 'Ayan Tufail', salary: 150000 },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);

const lastNWeekdays = (n) => {
    const days = [];
    const cursor = new Date();
    while (days.length < n) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() - 1);
    }
    return days.reverse();
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    // Remove the throwaway test HR account from earlier local setup, if present.
    await User.deleteOne({ email: 'hr@example.com' });

    // Departments
    const deptByName = {};
    for (const d of DEPARTMENTS) {
        let dept = await Department.findOne({ name: d.name });
        if (!dept) {
            dept = await Department.create(d);
            console.log(`Created department: ${d.name}`);
        }
        deptByName[d.name] = dept;
    }

    // Users
    const userByEmail = {};
    for (const p of PEOPLE) {
        let user = await User.findOne({ email: p.email });
        if (!user) {
            user = new User({
                name: p.name,
                email: p.email,
                password: PASSWORD,
                role: p.role,
                status: 'full time',
                department: p.department,
                reportingTo: p.reportingTo,
                salary: p.salary,
            });
            await user.save();
            console.log(`Created user: ${p.name} <${p.email}> (${p.role})`);
        } else {
            console.log(`User already exists, skipping: ${p.email}`);
        }
        userByEmail[p.email] = user;
    }

    // Attendance: last 5 weekdays for every employee (not the founder)
    const days = lastNWeekdays(5);
    const attendanceUsers = PEOPLE.filter(p => p.email !== 'fahad.tufail@tdc.com');
    let attendanceCreated = 0;
    for (const p of attendanceUsers) {
        const user = userByEmail[p.email];
        for (const day of days) {
            const dateStr = toDateStr(day);
            const exists = await Attendance.findOne({ employee: user._id, date: dateStr });
            if (exists) continue;

            const isLate = Math.random() < 0.3;
            const checkIn = new Date(day);
            if (isLate) {
                checkIn.setHours(9, 10 + Math.floor(Math.random() * 30), 0, 0);
            } else {
                checkIn.setHours(8, 45 + Math.floor(Math.random() * 14), 0, 0);
            }
            const checkOut = new Date(day);
            checkOut.setHours(17, 50 + Math.floor(Math.random() * 40) % 60, 0, 0);
            if (checkOut <= checkIn) checkOut.setHours(18, 30, 0, 0);

            await Attendance.create({ employee: user._id, date: dateStr, checkIn, checkOut });
            attendanceCreated++;
        }
    }
    console.log(`Created ${attendanceCreated} attendance records.`);

    // Leave requests, using the default leave types already seeded by connectDB()
    const annual = await LeaveType.findOne({ name: 'Annual Leave' });
    const sick = await LeaveType.findOne({ name: 'Sick Leave' });
    const casual = await LeaveType.findOne({ name: 'Casual Leave' });

    const leaveDefs = [
        { email: 'huzaifa@tdc.com', leaveType: casual, days: 1, offset: 3, reason: 'Personal errand', status: 'pending' },
        { email: 'laiba.ajmal@tdc.com', leaveType: annual, days: 4, offset: 10, reason: 'Family trip', status: 'approved' },
        { email: 'rahmeen.fatima@tdc.com', leaveType: sick, days: 2, offset: -2, reason: 'Fever', status: 'approved' },
        { email: 'tahseen.fatima@tdc.com', leaveType: casual, days: 1, offset: 5, reason: 'Personal work', status: 'pending' },
        { email: 'saad.jamil@tdc.com', leaveType: sick, days: 1, offset: -5, reason: 'Migraine', status: 'rejected' },
        { email: 'abdullah.tahir@tdc.com', leaveType: annual, days: 3, offset: 15, reason: 'Sibling\'s wedding', status: 'pending' },
    ];
    let leavesCreated = 0;
    for (const l of leaveDefs) {
        const user = userByEmail[l.email];
        if (!user || !l.leaveType) continue;
        const exists = await LeaveRequest.findOne({ employee: user._id, reason: l.reason });
        if (exists) continue;
        const start = new Date();
        start.setDate(start.getDate() + l.offset);
        const end = new Date(start);
        end.setDate(end.getDate() + l.days - 1);
        await LeaveRequest.create({
            employee: user._id,
            leaveType: l.leaveType._id,
            startDate: start,
            endDate: end,
            reason: l.reason,
            status: l.status,
        });
        leavesCreated++;
    }
    console.log(`Created ${leavesCreated} leave requests.`);

    // HR Requests (employee help-desk tickets, for HR to triage)
    const hrRequestDefs = [
        { email: 'huzaifa@tdc.com', type: 'Salary Slip', description: 'Need my June salary slip for a bank loan application.', status: 'Pending' },
        { email: 'saad.jamil@tdc.com', type: 'Work From Home', description: 'Requesting WFH for next Monday due to a home repair appointment.', status: 'In Review' },
        { email: 'abdullah.tahir@tdc.com', type: 'Attendance Correction', description: 'Forgot to check out on July 10, I left around 6:30 PM.', status: 'Resolved', hrNote: 'Verified with office CCTV, attendance corrected.' },
        { email: 'laiba.ajmal@tdc.com', type: 'Experience Letter', description: 'Need an experience letter for a visa application.', status: 'Pending' },
        { email: 'rahmeen.fatima@tdc.com', type: 'Other', description: 'Asking about the process to update my emergency contact details.', status: 'Pending' },
        { email: 'tahseen.fatima@tdc.com', type: 'Work From Home', description: 'Requesting to work remotely this Friday.', status: 'Rejected', hrNote: 'Client meeting scheduled on-site this Friday, please plan to come in.' },
    ];
    let hrRequestsCreated = 0;
    for (const r of hrRequestDefs) {
        const user = userByEmail[r.email];
        if (!user) continue;
        const exists = await HRRequest.findOne({ employee: user._id, description: r.description });
        if (exists) continue;
        await HRRequest.create({
            employee: user._id,
            type: r.type,
            description: r.description,
            status: r.status,
            hrNote: r.hrNote || '',
        });
        hrRequestsCreated++;
    }
    console.log(`Created ${hrRequestsCreated} HR requests.`);

    // Onboarding tasks, with some employees marked as having completed them
    const onboardingDefs = [
        { title: 'Complete company laptop setup', description: 'Install required dev tools and VPN client.', category: 'IT Setup', completedBy: ['huzaifa@tdc.com', 'saad.jamil@tdc.com', 'abdullah.tahir@tdc.com', 'laiba.ajmal@tdc.com', 'rahmeen.fatima@tdc.com', 'tahseen.fatima@tdc.com'] },
        { title: 'Sign employment contract', description: 'Review and digitally sign your contract.', category: 'Paperwork', completedBy: ['huzaifa@tdc.com', 'saad.jamil@tdc.com', 'abdullah.tahir@tdc.com', 'laiba.ajmal@tdc.com', 'rahmeen.fatima@tdc.com', 'tahseen.fatima@tdc.com'] },
        { title: 'Meet your team lead', description: 'Schedule a 1:1 intro call with Ayan Tufail.', category: 'General', completedBy: ['huzaifa@tdc.com', 'saad.jamil@tdc.com', 'laiba.ajmal@tdc.com'] },
        { title: 'Complete security & compliance training', description: 'Watch the onboarding security training video and pass the quiz.', category: 'Training', completedBy: ['huzaifa@tdc.com'] },
        { title: 'Set up direct deposit', description: 'Submit your bank details for salary payments.', category: 'Paperwork', completedBy: ['saad.jamil@tdc.com', 'abdullah.tahir@tdc.com'] },
    ];
    let onboardingCreated = 0;
    for (const t of onboardingDefs) {
        let task = await OnboardingTask.findOne({ title: t.title });
        if (!task) {
            task = await OnboardingTask.create({
                title: t.title,
                description: t.description,
                category: t.category,
                completedBy: t.completedBy.map(email => userByEmail[email]?._id).filter(Boolean),
            });
            onboardingCreated++;
        }
    }
    console.log(`Created ${onboardingCreated} onboarding tasks.`);

    // Holidays
    const holidayDefs = [
        { name: 'Independence Day', startDate: '2026-08-14', endDate: '2026-08-14', description: 'National holiday', type: 'public' },
        { name: 'TDC Anniversary', startDate: '2026-09-01', endDate: '2026-09-01', description: 'Company founding anniversary', type: 'public' },
    ];
    let holidaysCreated = 0;
    for (const h of holidayDefs) {
        const exists = await Holiday.findOne({ name: h.name });
        if (exists) continue;
        await Holiday.create(h);
        holidaysCreated++;
    }
    console.log(`Created ${holidaysCreated} holidays.`);

    // Announcement
    const founder = userByEmail['fahad.tufail@tdc.com'];
    const existingAnnouncement = await Announcement.findOne({ title: 'Welcome to TDC' });
    if (!existingAnnouncement && founder) {
        await Announcement.create({
            title: 'Welcome to TDC',
            message: 'Welcome to the TDC HR portal! Use this space to track attendance, leaves, and company updates.',
            createdBy: founder._id,
        });
        console.log('Created welcome announcement.');
    }

    console.log('\nSeed complete. Login with any of these (password for all: ' + PASSWORD + '):');
    for (const p of PEOPLE) console.log(`  ${p.email}  (${p.role})`);

    await mongoose.disconnect();
};

run().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
