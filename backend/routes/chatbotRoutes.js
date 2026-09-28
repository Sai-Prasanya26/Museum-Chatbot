const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/message', optionalAuth, ChatbotController.handleMessage);

module.exports = router;
