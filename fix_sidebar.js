const fs = require('fs');

// Fix EmployeeSidebar.jsx
let sidebar = fs.readFileSync('frontend/src/components/EmployeeDashboard/EmployeeSidebar.jsx', 'utf8');
sidebar = sidebar.replace(/\$\{user\?\._id\}/g, '${user?._id || user?.id}');
fs.writeFileSync('frontend/src/components/EmployeeDashboard/EmployeeSidebar.jsx', sidebar);

// Fix PracticeOnboardingWizard.jsx
let practice = fs.readFileSync('frontend/src/components/PracticeOnboardingWizard.jsx', 'utf8');
practice = practice.replace(/navigate\(\`\/employee\/\`\)/g, 'navigate(`/employee/${user?._id || user?.id}`)');
practice = practice.replace(/navigate\('\/employee'\)/g, 'navigate(`/employee/${user?._id || user?.id}`)');
fs.writeFileSync('frontend/src/components/PracticeOnboardingWizard.jsx', practice);

console.log('Fixed files');
