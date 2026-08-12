const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx', 'utf8');

// First restore it to standard quotes (if it got messed up)
content = content.replace(/navigate\(\/employee\/\/([a-zA-Z0-9\-]+)\)/g, "navigate('/employee/$1')");
content = content.replace(/navigate\(\/employee\/\/\)/g, "navigate('/employee')");

// Then replace with proper backtick templates
content = content.replace(/navigate\('\/employee\/([^']+)'\)/g, 'navigate(`/employee/${user?._id}/$1`)');
content = content.replace(/navigate\('\/employee'\)/g, 'navigate(`/employee/${user?._id}`)');
content = content.replace(/navigate\(\/employee\/\\\)/g, 'navigate(`/employee/${user?._id}`)');

fs.writeFileSync('frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx', content);
console.log('Fixed EmployeeOverview.jsx');
