const nodemailer = require('nodemailer');
const config = require('../config/config');
const TicketPdfService = require('./ticketPdfService');

class EmailService {
    static getTransporter() {
        if (!config.EMAIL.HOST || !config.EMAIL.USER) {
            return null;
        }

        return nodemailer.createTransport({
            host: config.EMAIL.HOST,
            port: config.EMAIL.PORT,
            secure: config.EMAIL.SECURE,
            auth: {
                user: config.EMAIL.USER,
                pass: config.EMAIL.PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Send booking receipt email with attached PDF ticket
     * @param {Object} booking 
     * @returns {Promise<{sent: boolean, message: string}>}
     */
    static async sendBookingReceipt(booking) {
        const recipientEmail = booking.visitor_email || booking.email;
        if (!recipientEmail) {
            console.warn('[EmailService] No recipient email address available for booking:', booking.booking_reference);
            return { sent: false, message: 'No recipient email specified' };
        }

        const museumName = booking.museum_name || 'Museum';
        const subject = `Your Museum Ticket Booking Confirmation - ${museumName}`;

        const adults = parseInt(booking.adult_count, 10) || 0;
        const children = parseInt(booking.child_count, 10) || 0;
        const seniors = parseInt(booking.senior_count, 10) || 0;
        const totalVisitors = adults + children + seniors;
        const totalAmount = parseFloat(booking.total_price || 0).toFixed(2);
        const txnRef = booking.transaction_id || booking.transaction_reference || 'N/A';
        const visitDate = booking.visit_date
            ? new Date(booking.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : '--';
        const bookedOn = booking.created_at
            ? new Date(booking.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                .header { background: #1e3a8a; color: #ffffff; padding: 30px 24px; text-align: center; }
                .header h1 { margin: 0 0 8px 0; font-size: 24px; }
                .header p { margin: 0; font-size: 14px; opacity: 0.9; }
                .status-banner { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px 24px; margin: 24px; border-radius: 6px; }
                .status-banner strong { color: #065f46; font-size: 16px; display: block; margin-bottom: 4px; }
                .status-banner p { margin: 0; color: #047857; font-size: 14px; }
                .details-box { padding: 0 24px 24px 24px; }
                .ref-badge { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px dashed #cbd5e1; }
                .ref-badge .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
                .ref-badge .code { font-size: 20px; font-family: monospace; font-weight: bold; color: #1e3a8a; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px 12px; text-align: left; font-size: 14px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                th { color: #64748b; font-weight: 600; width: 40%; }
                td { color: #0f172a; font-weight: 500; }
                .total-row { background: #eff6ff !important; font-weight: bold; color: #1d4ed8 !important; }
                .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${escapeHtml(museumName)}</h1>
                    <p>Official Digital Ticket Confirmation & Payment Receipt</p>
                </div>
                
                <div class="status-banner">
                    <strong>✓ Booking Confirmed Successfully</strong>
                    <p>Your booking has been successfully confirmed. Please find your booking receipt details below and in the attached PDF ticket.</p>
                </div>

                <div class="details-box">
                    <div class="ref-badge">
                        <div class="label">Booking Reference / Ticket ID</div>
                        <div class="code">${escapeHtml(booking.booking_reference)}</div>
                    </div>

                    <table>
                        <tr><th>Museum</th><td>${escapeHtml(museumName)}</td></tr>
                        <tr><th>Location</th><td>${escapeHtml((booking.museum_city ? booking.museum_city + ', ' : '') + (booking.museum_state || ''))}</td></tr>
                        <tr><th>Date of Visit</th><td><strong>${visitDate}</strong></td></tr>
                        <tr><th>Visitor Name</th><td>${escapeHtml(booking.visitor_name || booking.username || 'Visitor')}</td></tr>
                        <tr><th>Email</th><td>${escapeHtml(recipientEmail)}</td></tr>
                        ${booking.visitor_phone ? `<tr><th>Phone</th><td>${escapeHtml(booking.visitor_phone)}</td></tr>` : ''}
                        <tr><th>Adult Visitors</th><td>${adults}</td></tr>
                        <tr><th>Child Visitors</th><td>${children}</td></tr>
                        <tr><th>Senior Visitors</th><td>${seniors}</td></tr>
                        <tr><th>Total Visitors</th><td>${totalVisitors}</td></tr>
                        <tr class="total-row"><th>Total Amount Paid</th><td>₹${totalAmount} (PAID)</td></tr>
                        <tr><th>Payment Status</th><td><span style="color: #10b981; font-weight: bold;">PAID / SUCCESS</span></td></tr>
                        <tr><th>Payment Method</th><td>UPI</td></tr>
                        <tr><th>UPI Transaction Reference</th><td><code>${escapeHtml(txnRef)}</code></td></tr>
                        <tr><th>Booked Date & Time</th><td>${bookedOn}</td></tr>
                    </table>

                    <div style="background: #f1f5f9; padding: 14px; border-radius: 6px; font-size: 13px; color: #475569;">
                        <strong>Entry Instructions:</strong><br>
                        • Carry this confirmation email or download the attached PDF pass.<br>
                        • Present a valid Government Photo ID at the museum gate.<br>
                        • Timings: ${escapeHtml(booking.opening_time || '09:00 AM')} - ${escapeHtml(booking.closing_time || '05:30 PM')}.
                    </div>
                </div>

                <div class="footer">
                    <p>This is an automated confirmation email from Museum Explorer Ticketing System.<br>
                    Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        try {
            // Generate PDF attachment
            let pdfBuffer = null;
            try {
                pdfBuffer = await TicketPdfService.generateTicketPdf(booking);
            } catch (pdfErr) {
                console.error('[EmailService] Failed to generate PDF attachment:', pdfErr);
            }

            const transporter = this.getTransporter();
            if (!transporter) {
                console.log(`[EmailService] (Notice) SMTP credentials not configured in .env. Skipping email dispatch to ${recipientEmail}.`);
                console.log(`[EmailService] Booking ${booking.booking_reference} confirmed successfully with receipt generated.`);
                return {
                    sent: false,
                    message: 'SMTP not configured in environment; email notification skipped.'
                };
            }

            const mailOptions = {
                from: config.EMAIL.FROM,
                to: recipientEmail,
                subject: subject,
                text: `Your booking for ${museumName} on ${visitDate} is confirmed. Booking ID: ${booking.booking_reference}. Total Paid: Rs. ${totalAmount}. Payment Status: PAID.`,
                html: htmlContent,
                attachments: pdfBuffer ? [
                    {
                        filename: `Ticket_${booking.booking_reference}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ] : []
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[EmailService] Booking confirmation email sent to ${recipientEmail}:`, info.messageId);
            return { sent: true, messageId: info.messageId };
        } catch (err) {
            console.error(`[EmailService] Error sending email to ${recipientEmail}:`, err.message);
            // Requirement 13: Do NOT cancel the booking if email fails
            return { sent: false, error: err.message };
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = EmailService;
