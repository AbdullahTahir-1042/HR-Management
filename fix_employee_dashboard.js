const fs = require('fs');

const file = 'frontend/src/pages/EmployeeDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes("import toast from 'react-hot-toast';")) {
    content = "import toast from 'react-hot-toast';\n" + content;
}

// 2. Rename the local state and its references
content = content.replace(/const \[toast, setToast\]/g, "const [notificationToast, setNotificationToast]");
content = content.replace(/setToast/g, "setNotificationToast");
content = content.replace(/notification={toast}/g, "notification={notificationToast}");
content = content.replace(/\{toast && \(/g, "{notificationToast && (");

// 3. Replace alerts with toast.error and toast.success
content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
    if (p1.toLowerCase().includes('success') || p1.toLowerCase().includes('submitted!')) {
        return `toast.success(${p1})`;
    }
    return `toast.error(${p1})`;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed EmployeeDashboard.jsx');
