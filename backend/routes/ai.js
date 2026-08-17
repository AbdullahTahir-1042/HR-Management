const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcements');
const HRRequest = require('../models/HRRequest');
const generateHRAssistantPrompt = require('../prompts/hrAssistantPrompt');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');

// In-memory rate limit tracker (Increased for premium API access)
let requestTimestamps = [];
const FREE_TIER_LIMIT = 1000;

function updateAndGetQuota() {
    const now = Date.now();
    requestTimestamps.push(now);
    requestTimestamps = requestTimestamps.filter(t => now - t < 60000);
    return Math.max(0, FREE_TIER_LIMIT - requestTimestamps.length);
}

// Define tools for the AI
const tools = [
  {
    functionDeclarations: [
      {
        name: "apply_leave",
        description: "Apply for a leave on behalf of the employee. Use this when the user asks to submit a leave request.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            leaveTypeName: {
              type: SchemaType.STRING,
              description: "The type of leave (e.g. 'Sick Leave', 'Annual Leave', 'Casual Leave'). Try to match existing company leave types."
            },
            startDate: {
              type: SchemaType.STRING,
              description: "The start date of the leave in YYYY-MM-DD format."
            },
            endDate: {
              type: SchemaType.STRING,
              description: "The end date of the leave in YYYY-MM-DD format."
            },
            reason: {
              type: SchemaType.STRING,
              description: "A short reason for the leave."
            }
          },
          required: ["leaveTypeName", "startDate", "endDate", "reason"]
        }
      },
      {
        name: "get_company_attendance_today",
        description: "Get a list of all employees who are currently checked in, late, or present today. Use this when the user asks who is present or wants a real-time attendance report.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_my_attendance_report",
        description: "Get the attendance history for the currently logged-in user. Use this when the user asks about their own attendance, check-ins, or lates.",
        parameters: { 
          type: SchemaType.OBJECT, 
          properties: {
            days: {
              type: SchemaType.INTEGER,
              description: "The number of past days to retrieve (default is 7 if not specified)."
            }
          }
        }
      },
      {
        name: "get_employee_directory",
        description: "Get the company staff directory, including names, emails, departments, and roles of all employees. Use this to find contact information or check who works in what department.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_pending_leave_requests",
        description: "Get a list of all pending leave requests that need HR approval. Use this when an HR admin asks about pending leaves or leaves that need their attention.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_pending_hr_requests",
        description: "Get a list of all open or pending HR requests (like complaints, inquiries, feedback) submitted by employees.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_company_holidays",
        description: "Get the full list of all upcoming company holidays for the year.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      }
    ]
  }
];

router.post('/chat', auth, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ msg: 'Message is required' });
        }

        // Fetch basic context about the user
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Initialize model with role-restricted tools
        const isUserHR = user.role === 'hr';
        const allowedFunctionNames = isUserHR 
            ? ["apply_leave", "get_company_attendance_today", "get_employee_directory", "get_pending_leave_requests", "get_pending_hr_requests", "get_company_holidays", "get_my_attendance_report"]
            : ["apply_leave", "get_company_holidays", "get_my_attendance_report"];
            
        const userTools = [{
            functionDeclarations: tools[0].functionDeclarations.filter(t => allowedFunctionNames.includes(t.name))
        }];

        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            tools: userTools
        });

        // Fetch additional context
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 1. Today's attendance
        const todayAttendance = await Attendance.findOne({
            employee: req.user.id,
            date: today
        });

        // 2. Upcoming holidays (next 2)
        const upcomingHolidays = await Holiday.find({ date: { $gte: today } })
            .sort({ date: 1 })
            .limit(2);
            
        // 3. Latest announcements
        const latestAnnouncements = await Announcement.find()
            .sort({ date: -1 })
            .limit(2);

        // 4. Real Leave Balances
        const leaveTypes = await LeaveType.find();
        let leaveBalanceString = "";
        for (const lt of leaveTypes) {
            // Calculate total approved days used by this employee for this leave type
            const usedLeaves = await LeaveRequest.aggregate([
                { $match: { employee: user._id, leaveType: lt._id, status: 'approved' } },
                { $project: { days: { $add: [{ $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] }, 1] } } },
                { $group: { _id: null, totalDays: { $sum: "$days" } } }
            ]);
            const used = usedLeaves.length > 0 ? usedLeaves[0].totalDays : 0;
            leaveBalanceString += `- ${lt.name}: ${used} days used out of ${lt.quota} total quota\n`;
        }

        const roleInstructions = isUserHR 
            ? "As the user is an HR Admin, you can also READ live company data. If they ask who is present, fetch the attendance. If they ask about employees, fetch the directory. If they ask about pending leaves or HR requests, fetch the pending leave/HR requests. You can also fetch the full holiday calendar." 
            : "As the user is an Employee, you ONLY have access to their personal info and public company holidays (you can fetch the full holiday calendar). You DO NOT have access to the company directory, general attendance records, or other employees' data. If they ask for this, politely decline and explain your access limits. If they ask for their OWN attendance history, use the get_my_attendance_report tool.";

        // Generate dynamic PKT time strings
        const now = new Date();
        const pktFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Karachi',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        const currentDatetimePkt = pktFormatter.format(now).replace('GMT+5', 'PKT');
        
        const pktDateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const currentDatePkt = pktDateFormatter.format(now);

        // Build a dynamic system prompt with user context
        const userRoleFormatted = isUserHR ? 'HR_ADMIN' : user.isTeamLead ? 'MANAGER' : 'EMPLOYEE';
        
        const systemInstruction = generateHRAssistantPrompt({
            user,
            userRoleFormatted,
            currentDatetimePkt,
            todayAttendance,
            leaveBalanceString,
            upcomingHolidays,
            latestAnnouncements
        });

        // Start chat session with history
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts }]
            })),
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        // Send initial message
        let currentQuota = updateAndGetQuota(req.user.id);
        let result = await chat.sendMessage(message);
        
        // Check if the AI wants to call a function
        const functionCalls = result.response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
            // Strict security check to prevent hallucinated calls to restricted tools
            if (!allowedFunctionNames.includes(call.name)) {
                return res.json({
                    role: 'model',
                    parts: `I'm sorry, but I don't have access to the \`${call.name}\` tool based on your current permissions.`,
                    quotaRemaining: currentQuota
                });
            }
            
            if (call.name === 'apply_leave') {
                const { leaveTypeName, startDate, endDate, reason } = call.args;
                
                // Try to find the matching leave type in DB
                const leaveTypeMatch = await LeaveType.findOne({ 
                    name: { $regex: new RegExp(leaveTypeName, "i") } 
                });

                if (!leaveTypeMatch) {
                    // Send failure back to AI using a brand new request
                    const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                    currentQuota = updateAndGetQuota(req.user.id);
                    result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
                } else {
                    // Create the leave request
                    const newLeave = new LeaveRequest({
                        employee: req.user.id,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        reason: reason,
                        leaveType: leaveTypeMatch._id,
                        status: 'pending_hr'
                    });
                    
                    await newLeave.save();
                    
                    // Broadcast event so frontend auto-refreshes leave balances/lists (using exact same logic as your other controllers)
                    if (global.io) {
                         global.io.emit('leaveRequestCreated', newLeave);
                    }

                    // Send success back to AI using a brand new request to bypass SDK history role issues
                    const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                    
                    try {
                        currentQuota = updateAndGetQuota(req.user.id);
                        result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
                    } catch (aiError) {
                        console.error('Rate limit hit on second call:', aiError);
                        // Fallback response if rate limit blocks the second call
                        return res.json({
                            role: 'model',
                            parts: `Your **${leaveTypeMatch.name}** request from **${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}** for *"${reason}"* has been submitted successfully! 🎉\n\n*(Note: I am currently experiencing API rate limits, so I generated this automated fallback message, but rest assured your leave is safely in the database!)*`,
                            quotaRemaining: 0
                        });
                    }
                }
            } else if (call.name === 'get_company_attendance_today') {
                const today = new Date().toISOString().split('T')[0];
                const todaysAttendance = await Attendance.find({ date: today }).populate('employee', 'name department');
                const presentEmployees = todaysAttendance.filter(a => a.status === 'present' || a.status === 'late');
                
                const responseText = presentEmployees.length > 0 
                    ? presentEmployees.map(a => `- ${a.employee?.name || 'Unknown'} (${a.employee?.department || 'General'}) - Status: ${a.status} - In: ${new Date(a.checkIn).toLocaleTimeString()}`).join('\n')
                    : 'No employees have checked in today yet.';
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            } else if (call.name === 'get_my_attendance_report') {
                const days = call.args.days || 7;
                
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - days);
                const pastDateStr = pastDate.toISOString().split('T')[0];
                
                const myAttendance = await Attendance.find({ 
                    employee: req.user.id,
                    date: { $gte: pastDateStr }
                }).sort({ date: -1 });
                
                const responseText = myAttendance.length > 0
                    ? myAttendance.map(a => `- Date: ${a.date} | Status: ${a.status} | In: ${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'} | Out: ${a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'N/A'}`).join('\n')
                    : `No attendance records found for the past ${days} days.`;
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            } else if (call.name === 'get_employee_directory') {
                const employees = await User.find({ status: { $ne: 'Inactive' } }).select('name email department role');
                const responseText = employees.length > 0
                    ? employees.map(e => `- ${e.name} (${e.department || 'General'}) - ${e.email}`).join('\n')
                    : 'No active employees found.';
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            } else if (call.name === 'get_pending_leave_requests') {
                const pendingLeaves = await LeaveRequest.find({ status: 'pending_hr' }).populate('employee', 'name').populate('leaveType', 'name');
                const responseText = pendingLeaves.length > 0
                    ? pendingLeaves.map(l => `- ${l.employee?.name || 'Unknown'} requested ${l.leaveType?.name || 'Leave'} from ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}. Reason: ${l.reason}`).join('\n')
                    : 'There are currently no pending leave requests that need HR approval.';
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            } else if (call.name === 'get_pending_hr_requests') {
                const pendingRequests = await HRRequest.find({ status: { $in: ['Open', 'In Progress'] } }).populate('employee', 'name');
                const responseText = pendingRequests.length > 0
                    ? pendingRequests.map(r => `- [${r.type}] from ${r.employee?.name || 'Unknown'}: "${r.subject}" (Status: ${r.status})`).join('\n')
                    : 'There are currently no open HR requests.';
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            } else if (call.name === 'get_company_holidays') {
                const today = new Date();
                today.setHours(0,0,0,0);
                const holidays = await Holiday.find({ date: { $gte: today } }).sort({ date: 1 });
                const responseText = holidays.length > 0
                    ? holidays.map(h => `- ${h.name} on ${new Date(h.date).toLocaleDateString()}`).join('\n')
                    : 'There are no upcoming holidays found.';
                
                const newContents = [
                    ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.parts }] })),
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: call.name, response: { data: typeof responseText !== 'undefined' ? responseText : "Success" } } }] }
                ];
                currentQuota = updateAndGetQuota(req.user.id);
                result = await model.generateContent({ contents: newContents, systemInstruction: { parts: [{ text: systemInstruction }] } });
            }
        }

        const responseText = result.response.text();

        res.json({
            role: 'model',
            parts: responseText,
            quotaRemaining: currentQuota
        });

    } catch (error) {
        console.error('AI Chat Error:', error);
        
        // Handle Google API Rate Limits (429) explicitly so the user knows what's happening
        if (error.status === 429 || error.message.includes('429') || error.message.includes('Quota exceeded')) {
            return res.json({
                role: 'model',
                parts: "I'm currently experiencing a high volume of requests and have temporarily hit my Google API rate limit! Please give me about a minute to catch my breath and try again. 😅",
                quotaRemaining: 0
            });
        }
        
        // Handle Invalid API Key (401)
        if (error.status === 401 || error.message.includes('401') || error.message.includes('API_KEY_INVALID')) {
            return res.json({
                role: 'model',
                parts: "⚠️ **API Key Error:** Google's servers rejected the API key! \n\nThis usually means:\n1. Your new key has a typo in the `.env` file (like an extra space).\n2. The key hasn't fully activated yet (it can take 1-2 minutes for new keys to work).\n3. You haven't fully saved the `.env` file.\n\nPlease double check your `.env` file, ensure there are no spaces around the key, and try again in a minute!",
                quotaRemaining: 0
            });
        }

        res.status(500).json({ msg: 'Failed to process AI request', error: error.message });
    }
});

module.exports = router;
