const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx', 'utf8');

// Replace with proper backtick templates
content = content.replace(/navigate\('\/employee\/([^']+)'\)/g, 'navigate(`/employee/${user?._id || user?.id}/$1`)');
content = content.replace(/navigate\('\/employee'\)/g, 'navigate(`/employee/${user?._id || user?.id}`)');

fs.writeFileSync('frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx', content);
console.log('Fixed EmployeeOverview.jsx');
