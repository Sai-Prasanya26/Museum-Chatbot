const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { testConnection } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const museumRoutes = require('./routes/museumRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middleware imports
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static Files (Serve Frontend)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
// Transparent route alias ensuring /images/museums maps to assets/images/museums
app.use('/images/museums', express.static(path.join(frontendPath, 'assets', 'images', 'museums')));

// 3. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/museums', museumRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);

// 4. API Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        success: true,
        message: 'Museum Booking & Chatbot API is operational',
        timestamp: new Date().toISOString()
    });
});

// 5. Root & HTML Page Fallbacks / Aliases
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Explicit route aliases for seamless navigation across original and pages paths
const pageAliases = [
    { routes: ['/homepage.html', '/pages/homepage.html'], file: 'homepage.html' },
    { routes: ['/museumpage.html', '/pages/museums.html', '/museums.html'], file: 'museumpage.html' },
    { routes: ['/ticket.html', '/pages/ticket.html', '/chatbot.html', '/pages/chatbot.html'], file: 'ticket.html' },
    { routes: ['/booking.html', '/pages/booking.html'], file: 'booking.html' },
    { routes: ['/mybookings.html', '/pages/mybookings.html'], file: 'mybookings.html' },
    { routes: ['/login.html', '/pages/login.html'], file: 'login.html' },
    { routes: ['/register.html', '/pages/register.html'], file: 'register.html' },
    { routes: ['/admin.html', '/pages/admin.html'], file: 'admin.html' },
    { routes: ['/museum-details.html', '/pages/museum-details.html'], file: 'pages/museum-details.html' },
    { routes: ['/payment.html', '/pages/payment.html'], file: 'pages/payment.html' },
    { routes: ['/booking-confirmation.html', '/pages/booking-confirmation.html'], file: 'pages/booking-confirmation.html' }
];

pageAliases.forEach(alias => {
    alias.routes.forEach(route => {
        app.get(route, (req, res) => {
            res.sendFile(path.join(frontendPath, alias.file));
        });
    });
});

// 6. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 7. Start Server
async function startServer() {
    await testConnection();
    app.listen(config.PORT, () => {
        console.log(`==========================================================`);
        console.log(`[Server] Museum Booking System running on port ${config.PORT}`);
        console.log(`[Server] Access Frontend at: http://localhost:${config.PORT}`);
        console.log(`[Server] API Base URL: http://localhost:${config.PORT}/api`);
        console.log(`==========================================================`);
    });
}

startServer().catch(err => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
});

module.exports = app;
