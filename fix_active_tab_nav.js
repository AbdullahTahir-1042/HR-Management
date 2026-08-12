const fs = require('fs');

const empPath = 'frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx';
let emp = fs.readFileSync(empPath, 'utf8');

// replace setActiveTab('xyz') with navigate('/employee/xyz')
emp = emp.replace(/setActiveTab\('([^']+)'\)/g, "navigate('/employee/$1')");

fs.writeFileSync(empPath, emp, 'utf8');
console.log('Fixed EmployeeOverview.jsx');


const hrPath = 'frontend/src/components/HRDashboard/HROverview.jsx';
let hr = fs.readFileSync(hrPath, 'utf8');

if (!hr.includes("import { useNavigate }")) {
    hr = hr.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\nimport { useNavigate } from 'react-router-dom';");
}
if (!hr.includes("const navigate = useNavigate();")) {
    hr = hr.replace(/const HROverview =.*\{/, "$&\n    const navigate = useNavigate();");
}

hr = hr.replace(/setActiveTab\('([^']+)'\)/g, "navigate('/hr/$1')");

fs.writeFileSync(hrPath, hr, 'utf8');
console.log('Fixed HROverview.jsx');

