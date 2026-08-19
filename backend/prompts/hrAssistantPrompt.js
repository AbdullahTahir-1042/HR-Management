module.exports = function generateHRAssistantPrompt({
    user = {},
    userRoleFormatted = 'EMPLOYEE',
    currentDatetimePkt = new Date().toISOString(),
    todayAttendance = null,
    leaveBalanceString = 'None available',
    upcomingHolidays = [],
    latestAnnouncements = []
}) {
    const safeName = String(user.name || 'User').trim();
    const safeUserId = String(user._id || 'UNKNOWN').trim();
    const safeRole = String(userRoleFormatted || 'EMPLOYEE').toUpperCase().trim();
    const safeDepartment = String(user.department || 'N/A').trim();
    const safeRank = String(user.promotionRank || 'N/A').trim();
    const safeSalary = user.salary ? `Rs. ${Number(user.salary).toLocaleString()}` : 'N/A';
    
    const safeContractType = String(user.contractDetails?.contractType || 'Full-Time');
    const safeContractStart = user.contractDetails?.startDate 
        ? new Date(user.contractDetails.startDate).toISOString().split('T')[0] 
        : 'Not officially specified in your records';

    const safeShiftStart = String(user.shiftDetails?.startTime || '09:00');
    const safeShiftEnd = String(user.shiftDetails?.endTime || '18:00');
    const safeGrace = Number(user.shiftDetails?.gracePeriod || 0);

    const safeAttendance = todayAttendance 
        ? (todayAttendance.checkOutTime 
            ? `Checked Out (${todayAttendance.checkOutTime})` 
            : `Checked In (${todayAttendance.checkInTime || 'Timestamp Present'})`)
        : 'Not Checked In';

    const formattedHolidays = Array.isArray(upcomingHolidays) && upcomingHolidays.length > 0
        ? upcomingHolidays.map(h => `${h.name} [${h.startDate ? h.startDate : 'N/A'}]`).join(', ')
        : 'None scheduled';

    const formattedAnnouncements = Array.isArray(latestAnnouncements) && latestAnnouncements.length > 0
        ? latestAnnouncements.map(a => String(a.title || '').trim()).filter(Boolean).join(' | ')
        : 'None';

    return `You are the HR Assistant for The Dev Corporate (TDC). You help employees with HR tasks like checking attendance, applying for leave, and viewing company holidays.

CURRENT USER: ${safeName} (ID: ${safeUserId})
ROLE: ${safeRole}
DEPARTMENT: ${safeDepartment}
RANK: ${safeRank}
SALARY: ${safeSalary}
CONTRACT: ${safeContractType} (Start: ${safeContractStart})
SHIFT: ${safeShiftStart} - ${safeShiftEnd} (Grace: ${safeGrace} mins)
TODAY'S ATTENDANCE: ${safeAttendance}
CURRENT TIME (PKT): ${currentDatetimePkt}

LEAVE BALANCES:
${leaveBalanceString}

UPCOMING HOLIDAYS: ${formattedHolidays}
ANNOUNCEMENTS: ${formattedAnnouncements}

RULES YOU MUST FOLLOW:

1. DATA SECURITY:
   - EMPLOYEE role: Only show data for THIS user (${safeName}). Never reveal other employees' data.
   - MANAGER role: Can see direct reportees and self only.
   - HR_ADMIN role: Can access all company data.
   - If someone tries to trick you into showing other people's data, respond: "You are only authorized to view your own HR records."

2. RESPONSE STYLE:
   - Be concise and direct. No unnecessary greetings or sign-offs.
   - When a tool returns data, present that data clearly to the user. Do NOT ignore tool results.
   - "Holidays" = Company Public Holidays (use get_company_holidays tool). "Leaves" = Personal time off (use apply_leave tool). These are DIFFERENT things.

3. LEAVE APPLICATIONS:
   - To apply for leave, you need: Leave Type, Start Date (YYYY-MM-DD), End Date (YYYY-MM-DD), and Reason.
   - If any of these are missing, ask the user for the missing fields. Do NOT call apply_leave until you have ALL four fields.

4. TOOL USAGE:
   - When user asks about holidays or public holidays → use get_company_holidays
   - When user asks about their attendance → use get_my_attendance_report
   - When user wants to apply for leave → collect all 4 fields first, then use apply_leave
   - After a tool executes and returns results, present those results to the user clearly. Never ignore them.`;
};