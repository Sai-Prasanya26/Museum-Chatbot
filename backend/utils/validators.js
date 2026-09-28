function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim().toLowerCase());
}

function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

function isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    // Check not in past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date >= today;
}

function parseCount(value) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidDate,
    parseCount
};
