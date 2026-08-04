const fs = require('fs');
const path = require('path');

const targetDirs = [
    'd:\\hrmanagement\\HR-Management\\frontend\\src\\components',
    'd:\\hrmanagement\\HR-Management\\frontend\\src\\pages'
];

const replacements = [
    // Revert "AI/trendy" glassmorphism to professional solid styling
    { search: /bg-white\/90 backdrop-blur-xl/g, replace: 'bg-white' },
    { search: /shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]/g, replace: 'shadow-sm' },
    { search: /border-white\/60/g, replace: 'border-slate-200' },
    { search: /rounded-\[24px\]/g, replace: 'rounded-xl' },
    
    // Revert gradient background to solid professional background
    { search: /bg-gradient-to-br from-\[#F6EDE9\] via-\[#F2EEED\] to-\[#E9EDF5\]/g, replace: 'bg-[#F6EDE9]' },

    // Make buttons highly professional, matching the exact dark slate/brown theme of the project
    { search: /\bbg-stone-600\b/g, replace: 'bg-[#2D2A29]' },
    { search: /\bhover:bg-stone-700\b/g, replace: 'hover:bg-[#1a1818]' },
    { search: /\btext-stone-600\b/g, replace: 'text-[#2D2A29]' },
    { search: /\bhover:text-stone-700\b/g, replace: 'hover:text-[#1a1818]' },
    { search: /\bborder-stone-600\b/g, replace: 'border-[#2D2A29]' },
    { search: /\bbg-stone-50\b/g, replace: 'bg-slate-50' },
    { search: /\bbg-stone-100\b/g, replace: 'bg-slate-100' },
    { search: /\bring-stone-500\b/g, replace: 'ring-[#2D2A29]' },
    { search: /\btext-stone-500\b/g, replace: 'text-[#8B8887]' },
    { search: /\bborder-stone-200\b/g, replace: 'border-slate-200' },
    { search: /\btext-stone-400\b/g, replace: 'text-slate-400' },
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const {search, replace} of replacements) {
                if (search.test(content)) {
                    content = content.replace(search, replace);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

targetDirs.forEach(processDirectory);
console.log("Professional theme application complete.");
