const PaymentService = require('../services/paymentService');
const TransactionModel = require('../models/transactionModel');
const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');

class PaymentController {
    /**
     * Get UPI Payment configuration (UPI ID, Merchant Name, QR Image)
     */
    static getConfig(req, res, next) {
        try {
            const config = PaymentService.getPaymentConfig();
            res.status(200).json({
                success: true,
                data: config
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Step 1: Initiate Payment
     * Calculates authoritative ticket amount and returns a pending payment intent with QR details
     */
    static async initiatePayment(req, res, next) {
        try {
            const {
                museum_id,
                visit_date,
                adult_count,
                child_count,
                senior_count,
                visitor_name,
                visitor_email,
                visitor_phone,
                name,
                email,
                phone
            } = req.body;

            const userId = req.user ? req.user.id : null;

            const intent = await PaymentService.initiatePayment({
                museumId: museum_id,
                visitDate: visit_date,
                adultCount: adult_count,
                childCount: child_count,
                seniorCount: senior_count,
                visitorName: visitor_name || name,
                visitorEmail: visitor_email || email,
                visitorPhone: visitor_phone || phone,
                userId
            });

            res.status(200).json({
                success: true,
                message: 'Payment session initiated',
                data: intent
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Step 2: Verify Payment & Confirm Booking
     * Authoritatively verifies payment transaction reference before creating database booking.
     */
    static async verifyPayment(req, res, next) {
        try {
            const {
                payment_intent_id,
                transaction_id,
                transactionId,
                museum_id,
                visit_date,
                adult_count,
                child_count,
                senior_count,
                visitor_name,
                visitor_email,
                visitor_phone,
                name,
                email,
                phone
            } = req.body;

            const txnId = transaction_id || transactionId;
            if (!txnId || typeof txnId !== 'string' || !txnId.trim()) {
                return res.status(400).json({
                    success: false,
                    payment_status: 'PENDING',
                    message: 'Payment has not been verified. Please complete the UPI payment before confirming your booking.'
                });
            }

            let userId = req.user ? req.user.id : null;
            const userEmail = (visitor_email || email || 'visitor@museum.com').trim().toLowerCase();
            const userName = (visitor_name || name || userEmail.split('@')[0]).trim();
            const userPhone = (visitor_phone || phone || '').trim();

            if (!userId) {
                let user = await UserModel.findByEmail(userEmail);
                if (!user) {
                    const tempHash = await bcrypt.hash('Visitor@12345', 10);
                    user = await UserModel.create({
                        username: userName,
                        email: userEmail,
                        password_hash: tempHash,
                        role: 'user'
                    });
                }
                userId = user.id;
            }

            const booking = await PaymentService.verifyAndConfirmPayment({
                paymentIntentId: payment_intent_id,
                transactionId: txnId.trim(),
                museumId: museum_id,
                visitDate: visit_date,
                adultCount: adult_count,
                childCount: child_count,
                seniorCount: senior_count,
                visitorName: userName,
                visitorEmail: userEmail,
                visitorPhone: userPhone,
                userId
            });

            res.status(200).json({
                success: true,
                payment_status: 'SUCCESS',
                booking_status: 'CONFIRMED',
                message: 'Payment verified successfully and booking confirmed',
                data: booking
            });
        } catch (err) {
            // Handle expected payment verification states gracefully
            if (err.message && err.message.includes('still pending')) {
                return res.status(400).json({
                    success: false,
                    payment_status: 'PENDING',
                    message: err.message
                });
            }
            if (err.message && (err.message.includes('could not be verified') || err.message.includes('not been verified'))) {
                return res.status(400).json({
                    success: false,
                    payment_status: 'FAILED',
                    message: err.message
                });
            }
            next(err);
        }
    }

    /**
     * Backward-compatible processPayment route
     */
    static async processPayment(req, res, next) {
        return PaymentController.verifyPayment(req, res, next);
    }

    static async getTransaction(req, res, next) {
        try {
            const reference = req.params.reference;
            const transaction = await TransactionModel.getByReference(reference);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction record not found'
                });
            }

            if (req.user && transaction.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this transaction record.'
                });
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PaymentController;
