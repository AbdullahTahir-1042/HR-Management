const fs = require('fs');

// ── Fix HROverview.jsx ──
const hrPath = 'frontend/src/components/HRDashboard/HROverview.jsx';
let hr = fs.readFileSync(hrPath, 'utf8');
const hrLines = hr.split('\n');

// Map: line number -> correct route (based on card context from viewing the file)
const hrMapping = {
    // L23: "Review Leaves" button
    23: '/hr/leaves',
    // L37: Leave Requests card
    37: '/hr/leaves',
    // L60: Today's Attendance card
    60: '/hr/attendance',
    // L85: Total Employees card
    85: '/hr/employees',
    // L108: Company Holidays card
    108: '/hr/holidays',
    // L131: Announcements card
    131: '/hr/announcements',
    // L150: Mistake Reports card
    150: '/hr/mistake-reports',
    // L175: Employee Requests card (inside multi-line onClick)
    175: '/hr/hr-requests',
    // L204: Departments workspace
    204: '/hr/departments',
    // L211: Office Schedule workspace
    211: '/hr/office-schedule',
    // L218: Leave Types workspace
    218: '/hr/leave-types',
    // L225: Messages workspace
    225: '/hr/messages',
    // L232: User Reports workspace
    232: '/hr/reports',
    // L239: Training workspace
    239: '/hr/training',
};

for (const [lineNum, route] of Object.entries(hrMapping)) {
    const idx = parseInt(lineNum) - 1;
    if (idx >= 0 && idx < hrLines.length) {
        hrLines[idx] = hrLines[idx].replace(/navigate\('\/hr\/'\)/g, `navigate('${route}')`);
    }
}

fs.writeFileSync(hrPath, hrLines.join('\n'), 'utf8');
console.log('Fixed HROverview.jsx');

// Verify no remaining /hr/' navigates
const remaining = hrLines.filter(l => l.includes("navigate('/hr/')"));
if (remaining.length > 0) {
    console.log('WARNING: Still have ' + remaining.length + ' unfixed navigates in HROverview');
    remaining.forEach(l => console.log('  ' + l.trim()));
}

// ── Fix EmployeeOverview.jsx ──
const empPath = 'frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx';
let emp = fs.readFileSync(empPath, 'utf8');
const empLines = emp.split('\n');

// Map: line number -> correct route
const empMapping = {
    // L147: Check In Now button
    147: '/employee/attendance',
    // L155: Check Out button
    155: '/employee/attendance',
    // L162: Request Leave button
    162: '/employee/leaves',
    // L247: Performance card
    247: '/employee/performance',
    // L269: Today's Status card
    269: '/employee/attendance',
    // L304: Leaves Taken card
    304: '/employee/leaves',
    // L325: HR Requests card
    325: '/employee/hr-requests',
    // L349: Announcements card
    349: '/employee/announcements',
    // L375: Messages workspace
    375: '/employee/messages',
    // L382: Training Center workspace
    382: '/employee/training',
    // L389: Holidays workspace
    389: '/employee/holidays',
    // L397: My Team workspace
    397: '/employee/myTeam',
    // L411: Upcoming Holiday banner
    411: '/employee/holidays',
};

for (const [lineNum, route] of Object.entries(empMapping)) {
    const idx = parseInt(lineNum) - 1;
    if (idx >= 0 && idx < empLines.length) {
        empLines[idx] = empLines[idx].replace(/navigate\('\/employee\/'\)/g, `navigate('${route}')`);
    }
}

fs.writeFileSync(empPath, empLines.join('\n'), 'utf8');
console.log('Fixed EmployeeOverview.jsx');

// Verify
const empRemaining = empLines.filter(l => l.includes("navigate('/employee/')"));
if (empRemaining.length > 0) {
    console.log('WARNING: Still have ' + empRemaining.length + ' unfixed navigates in EmployeeOverview');
    empRemaining.forEach(l => console.log('  ' + l.trim()));
}
