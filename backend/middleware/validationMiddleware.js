const { isValidEmail, isValidPassword, isValidDate, parseCount } = require('../utils/validators');

function validateRegister(req, res, next) {
    const { username, email, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Username must be at least 2 characters long'
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }

    req.body.username = username.trim();
    req.body.email = email.trim().toLowerCase();
    next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Valid email is required'
        });
    }

    if (!password || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    req.body.email = email.trim().toLowerCase();
    next();
}

function validateBooking(req, res, next) {
    const { museum_id, visit_date, adult_count, child_count, senior_count } = req.body;

    if (!museum_id || isNaN(parseInt(museum_id, 10))) {
        return res.status(400).json({
            success: false,
            message: 'Valid museum_id is required'
        });
    }

    if (!isValidDate(visit_date)) {
        return res.status(400).json({
            success: false,
            message: 'Valid visit date (today or future) is required (YYYY-MM-DD)'
        });
    }

    const adults = parseCount(adult_count);
    const children = parseCount(child_count);
    const seniors = parseCount(senior_count);

    if (adults + children + seniors < 1) {
        return res.status(400).json({
            success: false,
            message: 'At least one ticket (Adult, Child, or Senior) must be selected'
        });
    }

    req.body.museum_id = parseInt(museum_id, 10);
    req.body.adult_count = adults;
    req.body.child_count = children;
    req.body.senior_count = seniors;
    next();
}

module.exports = {
    validateRegister,
    validateLogin,
    validateBooking
};
