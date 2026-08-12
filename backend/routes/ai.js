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
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');

// In-memory rate limit tracker (Free tier is ~20 RPM)
let requestTimestamps = [];
const FREE_TIER_LIMIT = 20;

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

        // Initialize model with tools
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            tools: tools
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

        // Build a dynamic system prompt with user context
        const systemInstruction = `You are an intelligent Virtual HR Assistant for The Dev Corporate (TDC). 
Your role is to help employees with HR policies, attendance queries, leave requests, and general HR guidance.
Be polite, concise, and professional. Use emojis sparingly.

You have the ability to APPLY FOR LEAVES directly using your tools. If the user asks to apply for a leave, ask them for the start date, end date, and reason if they haven't provided them, and then execute the function.

Here is the context about the user you are talking to:
- Name: ${user.name}
- Email: ${user.email}
- Department: ${user.department || 'Not specified'}
- Role: ${user.isHR ? 'HR Admin' : user.isTeamLead ? 'Team Lead' : 'Employee'}
- Today's Attendance Status: ${todayAttendance ? (todayAttendance.checkOutTime ? 'Checked Out' : 'Checked In') : 'Not Checked In'}

Leave Balances (CRITICAL: Only read from this list for leave balances):
${leaveBalanceString}
Latest Company Context:
- Upcoming Holidays: ${upcomingHolidays.map(h => h.name + ' on ' + new Date(h.date).toLocaleDateString()).join(', ') || 'None scheduled'}
- Recent Announcements: ${latestAnnouncements.map(a => a.title).join(', ') || 'No recent announcements'}

If they ask about their leaves or attendance, use the context above. If they ask about something you don't know, advise them to contact the HR department via the HR Requests portal.`;

        // Start chat session with history
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts }]
            })),
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        // Send initial message
        let currentQuota = updateAndGetQuota();
        let result = await chat.sendMessage(message);
        
        // Check if the AI wants to call a function
        const functionCalls = result.response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
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
                        { role: 'model', parts: [{ text: 'Processing...' }] },
                        { role: 'user', parts: [{ text: `SYSTEM LOG: The function apply_leave failed because leave type '${leaveTypeName}' was not found. Please tell the user.` }] }
                    ];
                    currentQuota = updateAndGetQuota();
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
                        { role: 'model', parts: [{ text: 'Applying leave...' }] },
                        { role: 'user', parts: [{ text: `SYSTEM LOG: The leave request was successfully saved in the database with ID ${newLeave._id}. Please inform the user that their leave was submitted successfully.` }] }
                    ];
                    
                    try {
                        currentQuota = updateAndGetQuota();
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
