const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { validateBooking } = require('../middleware/validationMiddleware');

// Booking creation supports both logged-in users and guest bookings
router.post('/', optionalAuth, validateBooking, BookingController.createBooking);
router.post('/create', optionalAuth, validateBooking, BookingController.createBooking); // Compatibility alias

// User booking history and cancellation requires authentication
router.get('/my-bookings', authMiddleware, BookingController.getMyBookings);
router.get('/reference/:reference/pdf', optionalAuth, BookingController.getBookingReceiptPdf);
router.get('/reference/:reference', optionalAuth, BookingController.getBookingByReference);
router.get('/:id', optionalAuth, BookingController.getBookingById);
router.patch('/:id/cancel', authMiddleware, BookingController.cancelBooking);
router.delete('/cancel/:id', authMiddleware, BookingController.cancelBooking); // Compatibility alias

module.exports = router;
