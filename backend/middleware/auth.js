const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const token = req.header('x-auth-token') || req.query.token;

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth middleware token error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isHR = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'No user on request — check auth middleware ran first' });
        }
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'hr') {
            return res.status(403).json({ msg: `Access denied. HR only. (your role: ${user?.role || 'none'})` });
        }
        next();
    } catch (err) {
        console.error('isHR Middleware Error:', err);
        res.status(500).json({ msg: 'Server error checking permissions' });
    }
};

// Team Lead middleware — checks isTeamLead flag on User (HR can also pass)
const isTeamLead = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'No user on request — check auth middleware ran first' });
        }
        const user = await User.findById(req.user.id);
        if (!user || (!user.isTeamLead && user.role !== 'hr')) {
            return res.status(403).json({ msg: 'Access denied. Team Lead only.' });
        }
        next();
    } catch (err) {
        console.error('isTeamLead Middleware Error:', err);
        res.status(500).json({ msg: 'Server error checking permissions' });
    }
};

module.exports = { auth, isHR, isTeamLead };