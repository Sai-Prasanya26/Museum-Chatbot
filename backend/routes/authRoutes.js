const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

router.post('/register', validateRegister, AuthController.register);
router.post('/signup', validateRegister, AuthController.register); // Alias for compatibility
router.post('/login', validateLogin, AuthController.login);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/logout', AuthController.logout);

module.exports = router;
