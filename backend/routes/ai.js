
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
const ChatSession = require('../models/ChatSession');
const generateHRAssistantPrompt = require('../prompts/hrAssistantPrompt');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');

// In-memory per-user rate limit tracker
const userRateLimits = new Map();
const FREE_TIER_LIMIT = 100;

function updateAndGetQuota(userId) {
    const now = Date.now();
    let timestamps = userRateLimits.get(userId) || [];
    timestamps.push(now);
    timestamps = timestamps.filter(t => now - t < 60000);
    userRateLimits.set(userId, timestamps);
    return Math.max(0, FREE_TIER_LIMIT - timestamps.length);
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const tools = [
  {
    functionDeclarations: [
      {
        name: "apply_leave",
        description: "Apply for a leave on behalf of the employee. Use this when the user asks to submit a leave request.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            leaveTypeName: { type: SchemaType.STRING, description: "The type of leave (e.g. 'Sick Leave')." },
            startDate: { type: SchemaType.STRING, description: "Start date in YYYY-MM-DD" },
            endDate: { type: SchemaType.STRING, description: "End date in YYYY-MM-DD" },
            reason: { type: SchemaType.STRING, description: "A short reason." }
          },
          required: ["leaveTypeName", "startDate", "endDate", "reason"]
        }
      },
      {
        name: "get_company_attendance_today",
        description: "Get a list of all employees who are currently checked in, late, or present today.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_my_attendance_report",
        description: "Get the PAST attendance HISTORY (previous days) for the currently logged-in user ONLY.",
        parameters: { 
          type: SchemaType.OBJECT, 
          properties: { days: { type: SchemaType.INTEGER, description: "Past days to retrieve (default 7)." } }
        }
      },
      {
        name: "get_employee_attendance_report",
        description: "HR ONLY: Get the past attendance history for a specific employee by name.",
        parameters: { 
          type: SchemaType.OBJECT, 
          properties: { 
            employeeName: { type: SchemaType.STRING, description: "The full or partial name of the employee." },
            days: { type: SchemaType.INTEGER, description: "Past days to retrieve (default 7)." }
          },
          required: ["employeeName"]
        }
      },
      {
        name: "get_employee_directory",
        description: "Get the company staff directory, including names, emails, departments, and roles.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_pending_leave_requests",
        description: "Get a list of all pending leave requests that need HR approval.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_pending_hr_requests",
        description: "Get a list of all open or pending HR requests.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_company_holidays",
        description: "Get the full list of all upcoming company holidays for the year.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
    ]
  }
];

// Load History Endpoint
router.get('/chat/history', auth, async (req, res) => {
    try {
        const session = await ChatSession.findOne(
            { user: req.user.id },
            { messages: { $slice: -50 } }
        );
        if (!session) {
            return res.json({ history: [] });
        }
        // Filter out function calls and system notes for the frontend UI
        const uiHistory = session.messages.filter(msg => 
            msg.parts && 
            msg.parts[0] && 
            typeof msg.parts[0].text === 'string' &&
            !msg.parts[0].text.startsWith('[System Note:')
        ).map(msg => ({
            role: msg.role,
            parts: msg.parts[0].text
        }));
        res.json({ history: uiHistory });
    } catch (err) {
        console.error('History fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Clear History Endpoint
router.delete('/chat/history', auth, async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({ user: req.user.id });
        res.json({ success: true, msg: 'Chat history cleared' });
    } catch (err) {
        console.error('Clear history error:', err);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// Chat SSE Endpoint
router.post('/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ msg: 'Message is required and must be a string' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ msg: 'Message exceeds the maximum limit of 2000 characters' });
        }

        let currentQuota = updateAndGetQuota(req.user.id);
        if (currentQuota <= 0) {
            return res.status(429).json({ msg: "Too many requests. Please wait a minute." });
        }

        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Context Fetching
        const user = await User.findById(req.user.id).select('-password');
        const isUserHR = user.role === 'hr';
        const allowedFunctionNames = isUserHR 
            ? ["apply_leave", "get_company_attendance_today", "get_employee_directory", "get_pending_leave_requests", "get_pending_hr_requests", "get_company_holidays", "get_my_attendance_report", "get_employee_attendance_report"]
            : ["apply_leave", "get_company_holidays", "get_my_attendance_report"];
            
        const userTools = [{
            functionDeclarations: tools[0].functionDeclarations.filter(t => allowedFunctionNames.includes(t.name))
        }];

        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash", tools: userTools });

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttendance = await Attendance.findOne({ employee: req.user.id, date: todayStr });
        const upcomingHolidays = await Holiday.find({ startDate: { $gte: todayStr } }).sort({ startDate: 1 }).limit(2);
        const latestAnnouncements = await Announcement.find().sort({ createdAt: -1 }).limit(2);

        const leaveTypes = await LeaveType.find();
        const usedLeaves = await LeaveRequest.aggregate([
            { $match: { employee: user._id, status: 'approved' } },
            { $project: { leaveType: 1, days: { $add: [{ $divide: [{ $subtract: ["$endDate", "$startDate"] }, 1000 * 60 * 60 * 24] }, 1] } } },
            { $group: { _id: "$leaveType", totalDays: { $sum: "$days" } } }
        ]);
        const usedLeavesMap = usedLeaves.reduce((acc, curr) => { acc[curr._id.toString()] = curr.totalDays; return acc; }, {});
        let leaveBalanceString = leaveTypes.map(lt => `- ${lt.name}: ${usedLeavesMap[lt._id.toString()] || 0} days used out of ${lt.quota} total quota`).join('\n');

        const pktFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
        const currentDatetimePkt = pktFormatter.format(now = new Date()).replace('GMT+5', 'PKT');
        const userRoleFormatted = isUserHR ? 'HR_ADMIN' : user.isTeamLead ? 'MANAGER' : 'EMPLOYEE';
        
        const systemInstruction = generateHRAssistantPrompt({
            user, userRoleFormatted, currentDatetimePkt, todayAttendance, leaveBalanceString, upcomingHolidays, latestAnnouncements
        });

        // Chat Session DB
        let chatSession = await ChatSession.findOne({ user: req.user.id });
        if (!chatSession) chatSession = new ChatSession({ user: req.user.id, messages: [] });

        // Build native history array for Gemini SDK (filter out breaking functionResponses)
        // Limit to last 20 messages to keep token count low and improve response speed
        const recentMessages = chatSession.messages.slice(-20);
        const nativeHistory = recentMessages.map(msg => {
            const safeParts = msg.parts.map(p => {
                if (p && p.functionResponse) {
                    return { text: `[System Note: Function ${p.functionResponse.name} was executed]` };
                }
                return p;
            });
            return {
                role: msg.role === 'function' ? 'user' : msg.role,
                parts: safeParts
            };
        });

        const chat = model.startChat({
            history: nativeHistory,
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        // Push User Message
        chatSession.messages.push({ role: 'user', parts: [{ text: message }] });
        await chatSession.save();

        // Add a 15-second timeout to prevent hanging connections
        const timeoutMs = 15000;
        const sendWithTimeout = (msg) => {
            return Promise.race([
                chat.sendMessageStream(msg),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), timeoutMs))
            ]);
        };

        let streamResult = await sendWithTimeout(message);
        
        let fullResponse = "";
        let functionCallToExecute = null;

        for await (const chunk of streamResult.stream) {
            const calls = chunk.functionCalls();
            if (calls && calls.length > 0) {
                functionCallToExecute = calls[0];
                break; // Stop streaming text, a tool needs to run
            }
            const chunkText = chunk.text();
            fullResponse += chunkText;
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        if (functionCallToExecute) {
            const call = functionCallToExecute;
            chatSession.messages.push({ role: 'model', parts: [{ functionCall: call }] });
            await chatSession.save();
            
            // Notify frontend that we are executing a tool
            res.write(`data: ${JSON.stringify({ type: 'status', text: `Fetching data...` })}\n\n`);
            
            let responseText = "Success";
            let responseObj = { data: "Success" };

            if (!allowedFunctionNames.includes(call.name)) {
                responseObj = { error: "Permission Denied" };
            } else if (call.name === 'apply_leave') {
                const { leaveTypeName, startDate, endDate, reason } = call.args;
                const leaveTypeMatch = await LeaveType.findOne({ name: { $regex: new RegExp(escapeRegex(leaveTypeName), "i") } });
                if (!leaveTypeMatch) {
                    responseObj = { error: `Leave type not found` };
                } else {
                    const newLeave = new LeaveRequest({ employee: req.user.id, startDate, endDate, reason, leaveType: leaveTypeMatch._id, status: 'pending_hr' });
                    await newLeave.save();
                    if (global.io) global.io.emit('leaveRequestCreated', newLeave);
                    responseObj = { success: true, leaveId: newLeave._id, status: 'pending_hr' };
                }
            } else if (call.name === 'get_company_attendance_today') {
                const todayStr = new Date().toISOString().split('T')[0];
                const todaysAttendance = await Attendance.find({ date: todayStr }).populate('employee', 'name department');
                const presentEmployees = todaysAttendance.filter(a => a.status === 'present' || a.status === 'late');
                responseText = presentEmployees.length > 0 ? presentEmployees.map(a => `- ${a.employee?.name || 'Unknown'} (${a.employee?.department || 'General'}) - Status: ${a.status} - In: ${new Date(a.checkIn).toLocaleTimeString()}`).join('\n') : 'No employees checked in.';
                responseObj = { data: responseText };
            } else if (call.name === 'get_my_attendance_report') {
                const days = call.args.days || 7;
                const pastDateStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const myAttendance = await Attendance.find({ employee: req.user.id, date: { $gte: pastDateStr } }).sort({ date: -1 });
                responseText = myAttendance.length > 0 ? myAttendance.map(a => `- Date: ${a.date} | Status: ${a.status} | In: ${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'}`).join('\n') : 'No records.';
                responseObj = { data: responseText };
            } else if (call.name === 'get_employee_attendance_report') {
                const { employeeName } = call.args;
                const days = call.args.days || 7;
                const targetEmployee = await User.findOne({ name: { $regex: new RegExp(escapeRegex(employeeName), "i") } });
                if (!targetEmployee) {
                    responseText = `Employee matching "${employeeName}" not found.`;
                } else {
                    const pastDateStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const employeeAttendance = await Attendance.find({ employee: targetEmployee._id, date: { $gte: pastDateStr } }).sort({ date: -1 });
                    responseText = employeeAttendance.length > 0 ? employeeAttendance.map(a => `- Date: ${a.date} | Status: ${a.status} | In: ${a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'}`).join('\n') : `No records for ${targetEmployee.name}.`;
                }
                responseObj = { data: responseText };
            } else if (call.name === 'get_employee_directory') {
                const employees = await User.find({ status: { $ne: 'Inactive' } }).select('name email department role promotionRank status contractDetails joiningStatus salary');
                responseText = employees.length > 0 ? employees.map(e => `- ${e.name} (${e.department || 'General'}) | Email: ${e.email} | Rank: ${e.promotionRank} | Status: ${e.status} | Joined: ${e.contractDetails?.startDate ? new Date(e.contractDetails.startDate).toISOString().split('T')[0] : 'Not specified'}`).join('\n') : 'No employees.';
                responseObj = { data: responseText };
            } else if (call.name === 'get_pending_leave_requests') {
                const pendingLeaves = await LeaveRequest.find({ status: 'pending_hr' }).populate('employee', 'name email department photo').populate('leaveType', 'name');
                responseText = pendingLeaves.length > 0 ? pendingLeaves.map(l => `- ${l.employee?.name || 'Unknown'} requested ${l.leaveType?.name || 'Leave'} from ${new Date(l.startDate).toLocaleDateString()}`).join('\n') : 'No pending requests.';
                responseObj = { data: responseText };
                res.write(`data: ${JSON.stringify({ type: 'ui', component: 'LeaveRequests', data: pendingLeaves })}\n\n`);
            } else if (call.name === 'get_pending_hr_requests') {
                const pendingRequests = await HRRequest.find({ status: { $in: ['Pending', 'In Review'] } }).populate('employee', 'name');
                responseText = pendingRequests.length > 0 ? pendingRequests.map(r => `- [${r.type}] from ${r.employee?.name || 'Unknown'}: "${r.description}"`).join('\n') : 'No open HR requests.';
                responseObj = { data: responseText };
            } else if (call.name === 'get_company_holidays') {
                const todayStr = new Date().toISOString().split('T')[0];
                const holidays = await Holiday.find({ startDate: { $gte: todayStr } }).sort({ startDate: 1 });
                responseText = holidays.length > 0 ? holidays.map(h => `- ${h.name} from ${h.startDate} to ${h.endDate}`).join('\n') : 'No upcoming holidays.';
                responseObj = { data: responseText };
            }

            const funcRespPart = { text: `[System Note: Function ${call.name} executed. Result: ${JSON.stringify(responseObj)}]` };
            chatSession.messages.push({ role: 'user', parts: [funcRespPart] });
            await chatSession.save();

            // Send tool response to model and stream the result
            const followupStream = await sendWithTimeout([funcRespPart]);
            for await (const chunk of followupStream.stream) {
                const chunkText = chunk.text();
                fullResponse += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Save final model response
        chatSession.messages.push({ role: 'model', parts: [{ text: fullResponse }] });
        await chatSession.save();

        res.write(`data: [DONE]\n\n`);
        res.end();

    } catch (error) {
        const isTimeout = error.message === 'AI_TIMEOUT';
        console.error(isTimeout ? 'AI Timeout (15s)' : 'AI Chat Error:', error);
        require('fs').appendFileSync('error_log.txt', new Date().toISOString() + (isTimeout ? ' AI Timeout' : ' AI Chat Error: ' + (error.stack || error)) + '\n');
        
        // Push error message to DB so history doesn't get desynced
        try {
            const session = await ChatSession.findOne({ user: req.user.id });
            if (session && session.messages.length > 0) {
                const lastMsg = session.messages[session.messages.length - 1];
                if (lastMsg.role === 'user') {
                    session.messages.push({ role: 'model', parts: [{ text: "*(Error: Lost connection to AI brain right now. Please try again later!)*" }] });
                    await session.save();
                }
            }
        } catch (dbErr) {
            console.error('DB error inside catch:', dbErr);
        }

        if (!res.headersSent) {
            res.status(500).json({ error: 'Server Error' });
        } else {
            res.write(`data: ${JSON.stringify({ text: "\n\n*(Error: Lost connection to AI brain)*" })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
        }
    }
});

module.exports = router;
