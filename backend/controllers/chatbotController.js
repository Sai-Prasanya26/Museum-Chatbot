const ChatbotService = require('../services/chatbotService');

class ChatbotController {
    static async handleMessage(req, res, next) {
        try {
            const { message } = req.body;
            const userId = req.user ? req.user.id : null;

            const response = await ChatbotService.processMessage(message, userId);

            res.status(200).json({
                success: true,
                reply: response.text,
                data: response
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ChatbotController;
