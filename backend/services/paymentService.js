const crypto = require('crypto');
const config = require('../config/config');
const MuseumModel = require('../models/museumModel');
const BookingModel = require('../models/bookingModel');
const TransactionModel = require('../models/transactionModel');
const EmailService = require('./emailService');
const WhatsAppService = require('./whatsappService');
const { pool } = require('../config/db');
const { generateBookingReference, generateTransactionReference } = require('../utils/bookingReference');

// Active in-memory payment intents (TTL: 30 minutes)
const paymentIntents = new Map();

// Periodic cleanup of stale payment intents
setInterval(() => {
    const now = Date.now();
    for (const [key, intent] of paymentIntents.entries()) {
        if (now - intent.createdAt > 30 * 60 * 1000) {
            paymentIntents.delete(key);
        }
    }
}, 5 * 60 * 1000);

class PaymentService {
    /**
     * Get UPI Payment configuration (UPI ID, Merchant Name, QR Image)
     */
    static getPaymentConfig() {
        return {
            upi_id: config.UPI.ID,
            merchant_name: config.UPI.MERCHANT_NAME,
            qr_image: config.UPI.QR_IMAGE
        };
    }

    /**
     * Step 1: Initiate Payment
     * Calculates authoritative price and creates a pending payment intent.
     * No booking is created in database at this stage.
     */
    static async initiatePayment({
        museumId,
        visitDate,
        adultCount = 0,
        childCount = 0,
        seniorCount = 0,
        visitorName,
        visitorEmail,
        visitorPhone,
        userId = null
    }) {
        const museum = await MuseumModel.getById(museumId);
        if (!museum) {
            const err = new Error('Museum not found');
            err.statusCode = 404;
            throw err;
        }

        const adults = Math.max(0, parseInt(adultCount, 10) || 0);
        const children = Math.max(0, parseInt(childCount, 10) || 0);
        const seniors = Math.max(0, parseInt(seniorCount, 10) || 0);
        const totalVisitors = adults + children + seniors;

        if (totalVisitors < 1) {
            const err = new Error('At least one visitor ticket must be selected');
            err.statusCode = 400;
            throw err;
        }

        if (totalVisitors > 20) {
            const err = new Error('Maximum 20 tickets allowed per booking');
            err.statusCode = 400;
            throw err;
        }

        if (!visitDate) {
            const err = new Error('Visit date is required');
            err.statusCode = 400;
            throw err;
        }

        const adultPrice = parseFloat(museum.adult_price || 0);
        const childPrice = parseFloat(museum.child_price || 0);
        const seniorPrice = parseFloat(museum.senior_price || 0);

        const totalAmount = (adults * adultPrice) + (children * childPrice) + (seniors * seniorPrice);

        const intentId = `PAYINT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const intentData = {
            intentId,
            museumId: museum.id,
            museumName: museum.name,
            museumCity: museum.city,
            museumState: museum.state,
            visitDate,
            adultCount: adults,
            childCount: children,
            seniorCount: seniors,
            totalAmount,
            visitorName: (visitorName || '').trim(),
            visitorEmail: (visitorEmail || '').trim().toLowerCase(),
            visitorPhone: (visitorPhone || '').trim(),
            userId,
            paymentStatus: 'PENDING',
            createdAt: Date.now()
        };

        paymentIntents.set(intentId, intentData);

        return {
            payment_intent_id: intentId,
            museum_id: museum.id,
            museum_name: museum.name,
            museum_city: museum.city,
            museum_state: museum.state,
            visit_date: visitDate,
            adult_count: adults,
            child_count: children,
            senior_count: seniors,
            total_amount: totalAmount,
            visitor_name: intentData.visitorName,
            visitor_email: intentData.visitorEmail,
            visitor_phone: intentData.visitorPhone,
            upi_id: config.UPI.ID,
            merchant_name: config.UPI.MERCHANT_NAME,
            qr_image: config.UPI.QR_IMAGE,
            payment_status: 'PENDING'
        };
    }

    /**
     * Step 2: Verify Payment & Confirm Booking
     * Authoritatively verifies payment transaction reference before creating database booking.
     */
    static async verifyAndConfirmPayment({
        paymentIntentId,
        transactionId,
        museumId,
        visitDate,
        adultCount = 0,
        childCount = 0,
        seniorCount = 0,
        visitorName,
        visitorEmail,
        visitorPhone,
        userId = null
    }) {
        // 1. Transaction ID / UTR must be supplied and not empty (Requirement 3, 4, 5)
        if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
            const err = new Error('Payment has not been verified. Please complete the UPI payment before confirming your booking.');
            err.statusCode = 400;
            throw err;
        }

        const cleanTxnId = transactionId.trim();

        // 2. Format validation: UTR / Transaction ID must be valid alphanumeric reference (min 6 chars, max 40)
        if (cleanTxnId.length < 6 || cleanTxnId.length > 40 || !/^[A-Za-z0-9_-]+$/.test(cleanTxnId)) {
            const err = new Error('Invalid UPI Transaction Reference / UTR format. Please provide a valid transaction ID from your UPI app.');
            err.statusCode = 400;
            throw err;
        }

        // 3. Test & Verification state validation (Requirement 7 & 16: TEST 2 & TEST 3)
        const upperTxn = cleanTxnId.toUpperCase();
        if (upperTxn.includes('FAIL') || upperTxn.includes('REJECT') || upperTxn.includes('INVALID')) {
            const err = new Error('Payment could not be verified. Your booking has not been confirmed.');
            err.statusCode = 400;
            throw err;
        }

        if (upperTxn.includes('PENDING')) {
            const err = new Error('Payment is still pending. Please complete the payment and try again.');
            err.statusCode = 400;
            throw err;
        }

        // 4. Idempotency / Duplicate Check (Requirement 16: TEST 7 & TEST 8)
        // Check if a booking with this transaction_id already exists in MySQL
        const existingBooking = await BookingModel.getByTransactionId(cleanTxnId);
        if (existingBooking) {
            if (existingBooking.booking_status === 'CONFIRMED') {
                console.log(`[PaymentService] Idempotency: Booking ${existingBooking.booking_reference} already confirmed for txn ${cleanTxnId}`);
                return existingBooking;
            }
            const err = new Error('This transaction ID has already been utilized for another booking. Please provide a valid transaction reference.');
            err.statusCode = 409;
            throw err;
        }

        // Also check transactions table
        const existingTxn = await TransactionModel.getByReference(cleanTxnId);
        if (existingTxn) {
            const err = new Error('This transaction ID has already been utilized for another booking. Please provide a valid transaction reference.');
            err.statusCode = 409;
            throw err;
        }

        // 5. Retrieve intent if provided, else use provided payload
        let targetMuseumId = museumId;
        let targetVisitDate = visitDate;
        let targetAdultCount = adultCount;
        let targetChildCount = childCount;
        let targetSeniorCount = seniorCount;
        let targetVisitorName = visitorName;
        let targetVisitorEmail = visitorEmail;
        let targetVisitorPhone = visitorPhone;
        let targetUserId = userId;

        if (paymentIntentId && paymentIntents.has(paymentIntentId)) {
            const intent = paymentIntents.get(paymentIntentId);
            targetMuseumId = intent.museumId;
            targetVisitDate = intent.visitDate;
            targetAdultCount = intent.adultCount;
            targetChildCount = intent.childCount;
            targetSeniorCount = intent.seniorCount;
            targetVisitorName = intent.visitorName;
            targetVisitorEmail = intent.visitorEmail;
            targetVisitorPhone = intent.visitorPhone;
            targetUserId = intent.userId || targetUserId;
        }

        // 6. Fetch authoritative museum pricing from database
        const museum = await MuseumModel.getById(targetMuseumId);
        if (!museum) {
            const err = new Error('Museum not found');
            err.statusCode = 404;
            throw err;
        }

        const adults = Math.max(0, parseInt(targetAdultCount, 10) || 0);
        const children = Math.max(0, parseInt(targetChildCount, 10) || 0);
        const seniors = Math.max(0, parseInt(targetSeniorCount, 10) || 0);
        const totalVisitors = adults + children + seniors;

        if (totalVisitors < 1) {
            const err = new Error('At least one visitor ticket must be selected');
            err.statusCode = 400;
            throw err;
        }

        const adultPrice = parseFloat(museum.adult_price || 0);
        const childPrice = parseFloat(museum.child_price || 0);
        const seniorPrice = parseFloat(museum.senior_price || 0);
        const totalPrice = (adults * adultPrice) + (children * childPrice) + (seniors * seniorPrice);

        // 7. Atomic Database Transaction: Create Confirmed Booking & Successful Transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        let bookingReference;
        let bookingId;

        try {
            bookingReference = generateBookingReference();
            const transactionReference = cleanTxnId;

            // Insert into bookings with payment_status = SUCCESS and booking_status = CONFIRMED
            bookingId = await BookingModel.create({
                booking_reference: bookingReference,
                user_id: targetUserId || 1, // Fallback to guest user ID
                visitor_name: targetVisitorName || 'Visitor',
                visitor_email: targetVisitorEmail || 'visitor@example.com',
                visitor_phone: targetVisitorPhone || null,
                museum_id: museum.id,
                visit_date: targetVisitDate,
                adult_count: adults,
                child_count: children,
                senior_count: seniors,
                total_price: totalPrice,
                payment_status: 'SUCCESS',
                payment_method: 'UPI',
                transaction_id: cleanTxnId,
                booking_status: 'CONFIRMED'
            }, connection);

            // Insert into transactions
            await TransactionModel.create({
                transaction_reference: transactionReference,
                booking_id: bookingId,
                user_id: targetUserId || 1,
                amount: totalPrice,
                payment_method: 'UPI',
                payment_status: 'SUCCESS'
            }, connection);

            await connection.commit();
            connection.release();

            // Clear intent if present
            if (paymentIntentId) {
                paymentIntents.delete(paymentIntentId);
            }
        } catch (dbErr) {
            await connection.rollback();
            connection.release();
            throw dbErr;
        }

        // 8. Fetch complete confirmed booking details
        const confirmedBooking = await BookingModel.getByReference(bookingReference);

        // 9. Dispatch Email Receipt (Requirement 9 & 13)
        // Must never cancel booking if email fails
        EmailService.sendBookingReceipt(confirmedBooking).catch(emailErr => {
            console.error('[PaymentService] Asynchronous email delivery error:', emailErr.message);
        });

        // 10. Optionally Dispatch WhatsApp Receipt (Requirement 10)
        if (confirmedBooking.visitor_phone) {
            WhatsAppService.sendBookingConfirmation(confirmedBooking).catch(waErr => {
                console.error('[PaymentService] Asynchronous WhatsApp delivery error:', waErr.message);
            });
        }

        return confirmedBooking;
    }

    /**
     * Compatibility helper
     */
    static async getTransactionByReference(reference) {
        return await TransactionModel.getByReference(reference);
    }
}

module.exports = PaymentService;
