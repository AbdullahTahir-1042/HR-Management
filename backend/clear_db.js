const mongoose = require('mongoose');
require('dotenv').config();

async function clear() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ChatSession = require('./models/ChatSession');
        await ChatSession.deleteMany({});
        console.log("Chat history cleared");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
clear();
