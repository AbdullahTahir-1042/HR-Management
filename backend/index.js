const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const connectDB = require('./db');

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')
        ) {
            return callback(null, true);
        }
        return callback(new Error('Access blocked by CORS policy'), false);
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

console.log('✓ Backend Entry Loaded');

connectDB();

app.get('/', (req, res) => res.send('Server is running'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leave'));
app.use('/api/departments', require('./routes/department'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/hr-requests', require('./routes/hrRequests'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/mistake-reports', require('./routes/mistakeReports')); // ✅ NEW
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/increments', require('./routes/increments'));
app.use('/api/performance-reviews', require('./routes/performanceReviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/test', require('./routes/test'));
console.log('✓ Test Route Registered');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));