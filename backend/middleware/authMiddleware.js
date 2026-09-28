const jwt = require('jsonwebtoken');
const config = require('../config/config');

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authorization token provided.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authorization header format. Expected Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, config.JWT.SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please log in again.'
        });
    }
}

// Optional auth: attaches req.user if token is present, but doesn't block if missing
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            try {
                const decoded = jwt.verify(parts[1], config.JWT.SECRET);
                req.user = decoded;
            } catch (e) {
                // Ignore optional token failure
            }
        }
    }
    next();
}

module.exports = {
    authMiddleware,
    optionalAuth
};
