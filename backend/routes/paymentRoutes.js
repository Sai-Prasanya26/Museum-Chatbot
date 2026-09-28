const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Get UPI payment configuration (actual UPI ID, merchant name, QR image)
router.get('/config', PaymentController.getConfig);

// Initiate payment (computes authoritative amount, returns payment intent)
router.post('/initiate', optionalAuth, PaymentController.initiatePayment);

// Verify UPI payment and confirm booking
router.post('/verify', optionalAuth, PaymentController.verifyPayment);

// Compatibility alias
router.post('/process', optionalAuth, PaymentController.processPayment);

// Retrieve transaction details
router.get('/transaction/:reference', optionalAuth, PaymentController.getTransaction);

module.exports = router;
