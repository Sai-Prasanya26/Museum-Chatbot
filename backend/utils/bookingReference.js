const crypto = require('crypto');

function generateBookingReference() {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `MUS-${year}-${randomHex}`;
}

function generateTransactionReference() {
    const timestamp = Date.now().toString().slice(-6);
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TXN-${timestamp}-${randomHex}`;
}

module.exports = {
    generateBookingReference,
    generateTransactionReference
};
