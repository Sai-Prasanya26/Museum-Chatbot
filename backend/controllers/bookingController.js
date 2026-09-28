const BookingService = require('../services/bookingService');
const BookingModel = require('../models/bookingModel');
const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');

class BookingController {
    static async createBooking(req, res, next) {
        try {
            const {
                museum_id,
                visit_date,
                adult_count,
                child_count,
                senior_count,
                payment_method,
                email,
                visitor_email,
                visitor_name,
                name,
                phone,
                visitor_phone,
                transaction_id,
                transactionId,
                payment_intent_id
            } = req.body;

            const txnId = transaction_id || transactionId;
            if (!txnId || typeof txnId !== 'string' || !txnId.trim()) {
                return res.status(400).json({
                    success: false,
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

            const booking = await BookingService.createBooking({
                userId,
                museumId: museum_id,
                visitDate: visit_date,
                adultCount: adult_count,
                childCount: child_count,
                seniorCount: senior_count,
                visitorName: userName,
                visitorEmail: userEmail,
                visitorPhone: userPhone,
                paymentMethod: payment_method || 'UPI',
                transactionId: txnId,
                paymentIntentId: payment_intent_id
            });

            res.status(201).json({
                success: true,
                message: 'Payment verified and booking confirmed successfully',
                data: booking
            });
        } catch (err) {
            next(err);
        }
    }

    static async getBookingReceiptPdf(req, res, next) {
        try {
            const reference = req.params.reference;
            const booking = await BookingModel.getByReference(reference);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            const TicketPdfService = require('../services/ticketPdfService');
            const pdfBuffer = await TicketPdfService.generateTicketPdf(booking);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Ticket_${booking.booking_reference}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        } catch (err) {
            next(err);
        }
    }

    static async getMyBookings(req, res, next) {
        try {
            const userId = req.user.id;
            const bookings = await BookingModel.getByUserId(userId);

            res.status(200).json({
                success: true,
                count: bookings.length,
                data: bookings
            });
        } catch (err) {
            next(err);
        }
    }

    static async getBookingById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const booking = await BookingModel.getById(id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Authorization: user can only see their own booking (unless admin)
            if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You cannot view bookings belonging to other users.'
                });
            }

            res.status(200).json({
                success: true,
                data: booking
            });
        } catch (err) {
            next(err);
        }
    }

    static async getBookingByReference(req, res, next) {
        try {
            const reference = req.params.reference;
            const booking = await BookingModel.getByReference(reference);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            if (req.user && booking.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this booking reference.'
                });
            }

            res.status(200).json({
                success: true,
                data: booking
            });
        } catch (err) {
            next(err);
        }
    }

    static async cancelBooking(req, res, next) {
        try {
            const bookingId = parseInt(req.params.id, 10);
            const userId = req.user.id;

            const cancelledBooking = await BookingService.cancelBooking({
                bookingId,
                userId
            });

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully. Payment marked as refunded.',
                data: cancelledBooking
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = BookingController;
