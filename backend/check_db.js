const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const ChatSession = require('./backend/models/ChatSession');
    const sessions = await ChatSession.find().lean();
    console.log(JSON.stringify(sessions, null, 2));
    process.exit(0);
}
check();
