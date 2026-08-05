const fs = require('fs');

const files = [
    'frontend/src/components/HRDashboard/OfficeScheduleManagement.jsx',
    'frontend/src/components/HRDashboard/HRTrainingManagement.jsx',
    'frontend/src/components/EmployeeDashboard/EmployeeTrainingCenter.jsx',
    'frontend/src/components/EmployeeDashboard/EmployeeOverview.jsx'
];

const replacements = [
    { regex: /(?<!dark:)bg-white/g, replace: 'bg-white dark:bg-slate-800' },
    { regex: /(?<!dark:)text-slate-900/g, replace: 'text-slate-900 dark:text-white' },
    { regex: /(?<!dark:)text-slate-800/g, replace: 'text-slate-800 dark:text-white' },
    { regex: /(?<!dark:)text-slate-700/g, replace: 'text-slate-700 dark:text-slate-200' },
    { regex: /(?<!dark:)text-slate-600/g, replace: 'text-slate-600 dark:text-slate-300' },
    { regex: /(?<!dark:)text-slate-500/g, replace: 'text-slate-500 dark:text-slate-400' },
    { regex: /(?<!dark:)bg-slate-50(?!\/)/g, replace: 'bg-slate-50 dark:bg-slate-900/50' },
    { regex: /(?<!dark:)bg-slate-100/g, replace: 'bg-slate-100 dark:bg-slate-700' },
    { regex: /(?<!dark:)border-slate-100/g, replace: 'border-slate-100 dark:border-slate-700' },
    { regex: /(?<!dark:)border-slate-200/g, replace: 'border-slate-200 dark:border-slate-700' },
    { regex: /(?<!dark:)border-slate-300/g, replace: 'border-slate-300 dark:border-slate-600' },
    { regex: /(?<!dark:)hover:bg-slate-50(?!\/)/g, replace: 'hover:bg-slate-50 dark:hover:bg-slate-700' },
    { regex: /(?<!dark:)hover:bg-slate-100/g, replace: 'hover:bg-slate-100 dark:hover:bg-slate-700' },
    { regex: /(?<!dark:)bg-indigo-50(?!\/)/g, replace: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { regex: /(?<!dark:)bg-indigo-100/g, replace: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { regex: /(?<!dark:)bg-violet-50(?!\/)/g, replace: 'bg-violet-50 dark:bg-violet-500/10' },
    { regex: /(?<!dark:)bg-emerald-50(?!\/)/g, replace: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { regex: /(?<!dark:)bg-amber-50(?!\/)/g, replace: 'bg-amber-50 dark:bg-amber-500/10' },
    { regex: /(?<!dark:)bg-rose-50(?!\/)/g, replace: 'bg-rose-50 dark:bg-rose-500/10' },
    // Fix any double dark: classes that might be created
    { regex: /dark:bg-slate-800 dark:bg-slate-800/g, replace: 'dark:bg-slate-800' },
    { regex: /dark:text-white dark:text-white/g, replace: 'dark:text-white' },
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
    }
    fs.writeFileSync(file, content);
}
console.log('Dark mode classes applied');
