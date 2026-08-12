const fs = require('fs');
const path = 'frontend/src/components/HRDashboard/HRSidebar.jsx';
let content = fs.readFileSync(path, 'utf8');

// Import Link, useNavigate, useLocation
if (!content.includes('import { useNavigate, useLocation, Link } from \'react-router-dom\';')) {
    content = content.replace(/import React from 'react';/, 'import React from \'react\';\nimport { useNavigate, useLocation, Link } from \'react-router-dom\';');
}

// Update props and hooks
content = content.replace(/const HRSidebar = \(\{ activeTab, setActiveTab, user, logout, isOpen, setIsOpen, unreadMessages = 0, pendingRequestsCount = 0 \}\) => \{/, 'const HRSidebar = ({ user, logout, isOpen, setIsOpen, unreadMessages = 0, pendingRequestsCount = 0 }) => {\n    const navigate = useNavigate();\n    const location = useLocation();\n\n    const getIsActive = (path) => {\n        if (path === \'dashboard\' && (location.pathname === \'/hr\' || location.pathname === \'/hr/\')) return true;\n        if (path !== \'dashboard\' && location.pathname.includes(\'/hr/\' + path)) return true;\n        return false;\n    };\n');

// Replace handleSidebarNavigate logic
content = content.replace(/<button([\s\S]*?)onClick=\{\(\) => handleSidebarNavigate\('(.+?)'\)\}([\s\S]*?)<\/button>/g, (match, before, id, after) => {
    const toPath = id === 'dashboard' ? '/hr' : '/hr/' + id;
    let newAfter = after.replace(/activeTab === '.+?'/g, `getIsActive('${id}')`);
    return `<Link${before}to="${toPath}" onClick={() => setIsOpen(false)}${newAfter}</Link>`;
});

// Replace setActiveTab logic
content = content.replace(/<button([\s\S]*?)onClick=\{\(\) => setActiveTab\('(.+?)'\)\}([\s\S]*?)<\/button>/g, (match, before, id, after) => {
    const toPath = id === 'dashboard' ? '/hr' : '/hr/' + id;
    let newAfter = after.replace(/activeTab === '.+?'/g, `getIsActive('${id}')`);
    return `<Link${before}to="${toPath}" onClick={() => setIsOpen(false)}${newAfter}</Link>`;
});

// Fix the activeTab reference in dashboard
content = content.replace(/activeTab === 'dashboard'/g, `getIsActive('dashboard')`);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed HRSidebar');
