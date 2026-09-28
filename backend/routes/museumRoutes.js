const express = require('express');
const router = express.Router();
const MuseumController = require('../controllers/museumController');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', MuseumController.getAllMuseums);
router.get('/all', MuseumController.getAllMuseums); // Compatibility alias
router.get('/search', MuseumController.searchMuseums);
router.get('/states', MuseumController.getStates);
router.get('/state/:state', MuseumController.getMuseumsByState);
router.get('/:id', MuseumController.getMuseumById);

// Admin-protected routes
router.post('/', authMiddleware, adminMiddleware, MuseumController.addMuseum);
router.post('/add', authMiddleware, adminMiddleware, MuseumController.addMuseum); // Compatibility alias
router.put('/:id', authMiddleware, adminMiddleware, MuseumController.updateMuseum);
router.delete('/:id', authMiddleware, adminMiddleware, MuseumController.deleteMuseum);

module.exports = router;
