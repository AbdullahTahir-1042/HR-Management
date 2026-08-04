const fs = require('fs');
const path = require('path');

const targetDirs = [
    'd:\\hrmanagement\\HR-Management\\frontend\\src\\components',
    'd:\\hrmanagement\\HR-Management\\frontend\\src\\pages'
];

const replacements = [
    { search: /\borange-/g, replace: 'stone-' },
    { search: /\bamber-/g, replace: 'stone-' },
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
            // Keep the custom colors in HROverview intact, only replace standard tailwind classes
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
console.log("Minimalist stone theme application complete.");
