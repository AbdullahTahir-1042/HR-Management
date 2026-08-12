const fs = require('fs');
const file = 'frontend/src/components/HRDashboard/HRAttendanceTracking.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Inject getLateness
const getLatenessFunc = `
    const getLateness = (dateObj) => {
        if (!dateObj) return null;
        const shiftStart = new Date(dateObj);
        shiftStart.setHours(9, 45, 0, 0); // 9:45 AM cutoff

        if (dateObj > shiftStart) {
            const diffMs = dateObj - shiftStart;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return hours > 0 ? \`\${hours}h \${mins}m\` : \`\${mins}m\`;
        }
        return null;
    };
`;

if (!content.includes('const getLateness =')) {
    content = content.replace('const formatDuration =', getLatenessFunc + '\n    const formatDuration =');
}

// 2. Update renderStatus
const oldRenderStatus = `
    const renderStatus = (record) => {
        if (record.status === 'absent' || !record.checkIn) {
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />Absent</span>;
        }
        if (record.status === 'late') {
            const expectedStr = record.expectedCheckIn || '09:00';
            const [startHour, startMin] = expectedStr.split(':').map(Number);
            const checkInTime = new Date(record.checkIn);
            const expectedTime = new Date(record.checkIn);
            expectedTime.setHours(startHour, startMin, 0, 0);
            
            const lateMs = checkInTime - expectedTime;
            let lateText = 'Late';
            if (lateMs > 0) {
                const lateHrs = Math.floor(lateMs / (1000 * 60 * 60));
                const lateMins = Math.floor((lateMs % (1000 * 60 * 60)) / (1000 * 60));
                lateText = \`Late (\${lateHrs > 0 ? \`\${lateHrs}H \` : ''}\${lateMins}M)\`;
            }

            return <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />{lateText}</span>;
        }
        return <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider w-fit">Present</span>;
    };
`;

const newRenderStatus = `
    const renderStatus = (record) => {
        if (record.status === 'absent' || !record.checkIn) {
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />Absent</span>;
        }
        
        const recordLate = getLateness(new Date(record.checkIn));
        if (record.status === 'late' || recordLate) {
            let lateText = recordLate ? \`Late (\${recordLate})\` : 'Late';
            return <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit"><AlertCircle size={12} />{lateText}</span>;
        }
        
        return <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider w-fit">Present</span>;
    };
`;

if (content.includes("const renderStatus = (record) => {")) {
    // We use a regex replace since the exact string might have slightly different spacing
    const startIndex = content.indexOf("const renderStatus = (record) => {");
    const endIndex = content.indexOf("return (", startIndex);
    content = content.substring(0, startIndex) + newRenderStatus.trim() + "\n\n    " + content.substring(endIndex);
}


// 3. Update map loop to calculate isLate properly and display badge
const oldMapStart = `
                        {sortedAttendance.map(record => {
                            const isLate = record.status === 'late';
                            return (
`;

const newMapStart = `
                        {sortedAttendance.map(record => {
                            const recordLate = record.checkIn ? getLateness(new Date(record.checkIn)) : null;
                            const isLate = record.status === 'late' || !!recordLate;
                            return (
`;
content = content.replace(oldMapStart.trim(), newMapStart.trim());

// 4. Update Check In column to show the amber badge if recordLate
const oldCheckIn = `
                                            <>
                                                <div className={\`w-2 h-2 rounded-full \${isLate ? 'bg-red-500' : 'bg-emerald-500'}\`}></div>
                                                {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </>
`;
const newCheckIn = `
                                            <>
                                                <div className={\`w-2 h-2 rounded-full \${isLate ? 'bg-rose-500' : 'bg-emerald-500'}\`}></div>
                                                {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {recordLate && (
                                                    <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-[10px] ml-2 inline-block">
                                                        {recordLate}
                                                    </span>
                                                )}
                                            </>
`;
content = content.replace(oldCheckIn.trim(), newCheckIn.trim());

// Make sure we change text-red-600 to text-rose-600 in the Check In text color to match employee dashboard exactly (which uses text-rose-600)
content = content.replace(
    "text-red-600 dark:text-red-400 font-bold",
    "text-rose-600 dark:text-rose-400 font-bold"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated HRAttendanceTracking.jsx');
