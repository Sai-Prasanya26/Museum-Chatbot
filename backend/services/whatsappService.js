const config = require('../config/config');

class WhatsAppService {
    /**
     * Optionally send booking confirmation via WhatsApp if configured in environment
     * @param {Object} booking 
     * @returns {Promise<{sent: boolean, message: string}>}
     */
    static async sendBookingConfirmation(booking) {
        const phone = booking.visitor_phone;
        if (!phone) {
            return { sent: false, message: 'No phone number provided' };
        }

        if (!config.WHATSAPP.ENABLED || !config.WHATSAPP.API_TOKEN || !config.WHATSAPP.PHONE_NUMBER_ID) {
            console.log('[WhatsAppService] WhatsApp integration not configured or disabled in .env. Skipping.');
            return { sent: false, message: 'WhatsApp integration not configured' };
        }

        // Clean phone number (must be international format without + or spaces for WhatsApp Cloud API)
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        try {
            const url = `${config.WHATSAPP.API_URL || 'https://graph.facebook.com/v18.0/'}${config.WHATSAPP.PHONE_NUMBER_ID}/messages`;
            
            const messageBody = `🏛️ *Museum Ticket Confirmed!*\n\n` +
                `*Museum:* ${booking.museum_name}\n` +
                `*Date of Visit:* ${new Date(booking.visit_date).toLocaleDateString('en-IN')}\n` +
                `*Booking ID:* ${booking.booking_reference}\n` +
                `*Total Visitors:* ${(parseInt(booking.adult_count, 10) || 0) + (parseInt(booking.child_count, 10) || 0) + (parseInt(booking.senior_count, 10) || 0)}\n` +
                `*Amount Paid:* ₹${booking.total_price}\n` +
                `*Status:* Confirmed (PAID)\n\n` +
                `Please carry a valid Government ID for entry. Thank you for booking with Museum Explorer!`;

            const payload = {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'text',
                text: { body: messageBody }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.WHATSAPP.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('[WhatsAppService] WhatsApp API error response:', data);
                return { sent: false, message: data.error?.message || 'API error' };
            }

            console.log(`[WhatsAppService] WhatsApp message sent to ${cleanPhone}:`, data);
            return { sent: true, data };
        } catch (err) {
            console.error('[WhatsAppService] WhatsApp dispatch error:', err.message);
            // Non-blocking as per Requirement 10
            return { sent: false, error: err.message };
        }
    }
}

module.exports = WhatsAppService;
