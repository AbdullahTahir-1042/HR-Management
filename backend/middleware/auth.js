const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isHR = async (req, res, next) => {
    try {
        console.log('isHR check for user ID:', req.user?.id);
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'hr') {
            return res.status(403).json({ msg: 'Access denied. HR only.' });
        }
        next();
    } catch (err) {
        console.error('isHR Middleware Error:', err);
        res.status(500).send('Server Error');
    }
};

module.exports = { auth, isHR };
