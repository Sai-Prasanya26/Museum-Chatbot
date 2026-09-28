const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const MuseumController = require('../controllers/museumController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Enforce authentication AND admin privileges across all admin endpoints
router.use(authMiddleware);
router.use(adminMiddleware);

// 1. Dashboard Statistics
router.get('/stats', AdminController.getStats);
router.get('/dashboard', AdminController.getStats); // Alias

// 2. User Management
router.get('/users', AdminController.getUsers);
router.put('/users/:id/role', AdminController.updateUserRole);

// 3. Booking Management
router.get('/bookings', AdminController.getBookings);
router.patch('/bookings/:id/status', AdminController.updateBookingStatus);
router.put('/bookings/:id/status', AdminController.updateBookingStatus);

// 4. Museum Management (Delegated to existing MuseumController)
router.get('/museums', MuseumController.getAllMuseums);
router.post('/museums', MuseumController.addMuseum);
router.put('/museums/:id', MuseumController.updateMuseum);
router.delete('/museums/:id', MuseumController.deleteMuseum);

module.exports = router;
