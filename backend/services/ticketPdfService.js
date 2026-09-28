const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class TicketPdfService {
    /**
     * Generates a PDF receipt buffer for a confirmed booking
     * @param {Object} booking 
     * @returns {Promise<Buffer>}
     */
    static async generateTicketPdf(booking) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 40,
                    info: {
                        Title: `Museum Ticket - ${booking.booking_reference}`,
                        Author: 'Museum Explorer Platform',
                        Subject: `E-Ticket for ${booking.museum_name || 'Museum Visit'}`
                    }
                });

                const buffers = [];
                doc.on('data', chunk => buffers.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', err => reject(err));

                // 1. Header Banner
                doc.rect(40, 40, 515, 75).fill('#1e3a8a');
                doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
                   .text('MUSEUM EXPLORER', 60, 55, { align: 'left' });
                doc.fontSize(11).font('Helvetica')
                   .text('Official Digital Entry Pass & Payment Receipt', 60, 85, { align: 'left' });
                
                doc.fontSize(12).font('Helvetica-Bold')
                   .text('STATUS: CONFIRMED', 380, 65, { align: 'right' });
                doc.fontSize(9).font('Helvetica')
                   .text('PAID VIA UPI', 380, 85, { align: 'right' });

                // 2. Booking Reference Highlight Box
                doc.rect(40, 130, 515, 55).fill('#f0fdf4').stroke('#16a34a');
                doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold')
                   .text('OFFICIAL BOOKING REFERENCE / TICKET ID', 55, 140);
                doc.fillColor('#14532d').fontSize(18).font('Courier-Bold')
                   .text(booking.booking_reference || 'N/A', 55, 156);

                const bookedDateStr = booking.created_at
                    ? new Date(booking.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

                doc.fillColor('#166534').fontSize(9).font('Helvetica')
                   .text(`Issued: ${bookedDateStr} IST`, 350, 158, { align: 'right' });

                // 3. Main Ticket Details
                let y = 205;
                doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold')
                   .text('Visit Information', 40, y);
                doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y + 20).lineTo(555, y + 20).stroke();

                y += 30;
                const col1 = 50;
                const col2 = 300;

                const drawField = (label, value, x, currentY) => {
                    doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text(label, x, currentY);
                    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(String(value || '--'), x, currentY + 13);
                };

                const visitDateStr = booking.visit_date
                    ? new Date(booking.visit_date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })
                    : '--';

                drawField('MUSEUM', booking.museum_name || 'Museum', col1, y);
                drawField('DATE OF VISIT', visitDateStr, col2, y);

                y += 42;
                const location = `${booking.museum_city ? booking.museum_city + ', ' : ''}${booking.museum_state || ''}`;
                drawField('LOCATION', location || 'India', col1, y);
                drawField('TIMINGS', `${booking.opening_time || '09:00 AM'} - ${booking.closing_time || '05:30 PM'}`, col2, y);

                y += 42;
                drawField('VISITOR NAME', booking.visitor_name || booking.username || 'Visitor', col1, y);
                drawField('VISITOR EMAIL', booking.visitor_email || booking.email || '--', col2, y);

                if (booking.visitor_phone) {
                    y += 42;
                    drawField('PHONE NUMBER', booking.visitor_phone, col1, y);
                    drawField('PAYMENT METHOD', booking.payment_method || 'UPI', col2, y);
                } else {
                    y += 42;
                    drawField('PAYMENT METHOD', booking.payment_method || 'UPI', col1, y);
                    drawField('PAYMENT STATUS', 'SUCCESS / PAID', col2, y);
                }

                // 4. Visitors & Ticket Breakdown Table
                y += 50;
                doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold')
                   .text('Ticket & Visitor Breakdown', 40, y);
                doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y + 20).lineTo(555, y + 20).stroke();

                y += 30;
                // Table header
                doc.rect(40, y, 515, 24).fill('#f1f5f9');
                doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold')
                   .text('CATEGORY', 55, y + 7)
                   .text('TICKET COUNT', 260, y + 7)
                   .text('TOTAL AMOUNT', 450, y + 7, { align: 'right' });

                y += 24;
                const adults = parseInt(booking.adult_count, 10) || 0;
                const children = parseInt(booking.child_count, 10) || 0;
                const seniors = parseInt(booking.senior_count, 10) || 0;
                const totalVisitors = adults + children + seniors;

                const addRow = (label, count) => {
                    doc.rect(40, y, 515, 22).fill(y % 44 === 0 ? '#ffffff' : '#f8fafc');
                    doc.fillColor('#1f2937').fontSize(9).font('Helvetica')
                       .text(label, 55, y + 6)
                       .text(String(count), 260, y + 6);
                    y += 22;
                };

                if (adults > 0) addRow(`Adult Visitors`, adults);
                if (children > 0) addRow(`Child Visitors`, children);
                if (seniors > 0) addRow(`Senior Visitors`, seniors);

                // Total Row
                doc.rect(40, y, 515, 28).fill('#e0f2fe').stroke('#0284c7');
                doc.fillColor('#0369a1').fontSize(10).font('Helvetica-Bold')
                   .text(`TOTAL VISITORS: ${totalVisitors}`, 55, y + 9)
                   .text(`AMOUNT PAID: Rs. ${parseFloat(booking.total_price || 0).toFixed(2)}`, 350, y + 9, { align: 'right' });

                // 5. Transaction / Payment Details Box
                y += 45;
                doc.rect(40, y, 515, 48).fill('#f9fafb').stroke('#e5e7eb');
                doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
                   .text('PAYMENT VERIFICATION DETAILS', 55, y + 9);
                doc.fillColor('#4b5563').fontSize(9).font('Helvetica')
                   .text(`UPI Transaction / UTR Ref: ${booking.transaction_id || booking.transaction_reference || 'N/A'}`, 55, y + 23)
                   .text(`Payment Status: VERIFIED & PAID (UPI)`, 55, y + 34);

                // 6. Digital QR Entry Pass Box
                y += 58;
                doc.rect(40, y, 515, 75).fill('#f0fdf4').stroke('#86efac');
                
                const qrImagePath = path.join(__dirname, '..', '..', 'frontend', 'images', 'scanner.png');
                if (fs.existsSync(qrImagePath)) {
                    try {
                        doc.image(qrImagePath, 52, y + 6, { width: 62, height: 62 });
                    } catch (e) {
                        // ignore if image load issue
                    }
                }
                
                doc.fillColor('#166534').fontSize(11).font('Helvetica-Bold')
                   .text('DIGITAL GATE PASS & ENTRY QR', 125, y + 12);
                doc.fillColor('#374151').fontSize(8.5).font('Helvetica')
                   .text('Scan this QR code at museum turnstile or present booking ID to security for authorized entry.', 125, y + 28, { width: 410 })
                   .text(`Authorized Booking Ref: ${booking.booking_reference || 'N/A'}`, 125, y + 48);

                // 7. Entry Notice / Guidelines
                y += 85;
                doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
                   .text('IMPORTANT GUIDELINES FOR ENTRY:', 40, y)
                   .text('1. Present this digital ticket or a printed copy along with a valid Government Photo ID at entry.', 40, y + 12)
                   .text('2. Tickets are valid strictly for the booked date and museum operational hours.', 40, y + 22)
                   .text('3. This ticket was authoritatively verified and generated by the Museum Ticket Management System.', 40, y + 32);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = TicketPdfService;
