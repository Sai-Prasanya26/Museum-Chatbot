const { pool } = require('../config/db');
const MuseumModel = require('../models/museumModel');
const BookingModel = require('../models/bookingModel');
const TransactionModel = require('../models/transactionModel');
const PaymentService = require('./paymentService');

class BookingService {
    /**
     * Creation of a booking REQUIRES verified payment (Requirement 3, 4, 5).
     * If transactionId is missing or empty, throws 400 and creates no record.
     */
    static async createBooking({
        userId,
        museumId,
        visitDate,
        adultCount = 0,
        childCount = 0,
        seniorCount = 0,
        visitorName,
        visitorEmail,
        visitorPhone,
        paymentMethod = 'UPI',
        transactionId = null,
        paymentIntentId = null
    }) {
        if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
            const error = new Error('Payment has not been verified. Please complete the UPI payment before confirming your booking.');
            error.statusCode = 400;
            throw error;
        }

        // Delegate to PaymentService to verify payment transaction and confirm booking
        return await PaymentService.verifyAndConfirmPayment({
            paymentIntentId,
            transactionId: transactionId.trim(),
            museumId,
            visitDate,
            adultCount,
            childCount,
            seniorCount,
            visitorName,
            visitorEmail,
            visitorPhone,
            userId
        });
    }

    static async cancelBooking({ bookingId, userId }) {
        const booking = await BookingModel.getById(bookingId);
        if (!booking) {
            const error = new Error('Booking not found');
            error.statusCode = 404;
            throw error;
        }

        if (booking.user_id !== userId) {
            const error = new Error('Access denied. You can only cancel your own bookings.');
            error.statusCode = 403;
            throw error;
        }

        if (booking.booking_status === 'CANCELLED') {
            const error = new Error('This booking is already cancelled');
            error.statusCode = 400;
            throw error;
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'UPDATE bookings SET booking_status = "CANCELLED", payment_status = "FAILED" WHERE id = ?',
                [bookingId]
            );

            await connection.query(
                'UPDATE transactions SET payment_status = "REFUNDED" WHERE booking_id = ?',
                [bookingId]
            );

            await connection.commit();
            connection.release();

            return await BookingModel.getById(bookingId);
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    }
}

module.exports = BookingService;
