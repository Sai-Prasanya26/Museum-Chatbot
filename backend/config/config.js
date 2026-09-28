require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    DB: {
        HOST: process.env.DB_HOST || 'localhost',
        PORT: parseInt(process.env.DB_PORT, 10) || 3306,
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'museum_booking',
        CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
    },
    JWT: {
        SECRET: process.env.JWT_SECRET || 'museum_booking_jwt_secret_key_2026_secure',
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
    },
    UPI: {
        ID: process.env.UPI_ID || 'museums.tickets@icici',
        MERCHANT_NAME: process.env.UPI_MERCHANT_NAME || 'Museum Explorer Tickets',
        QR_IMAGE: process.env.UPI_QR_IMAGE || '/images/scanner.png'
    },
    EMAIL: {
        HOST: process.env.SMTP_HOST || '',
        PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
        SECURE: process.env.SMTP_SECURE === 'true',
        USER: process.env.SMTP_USER || '',
        PASS: process.env.SMTP_PASS || '',
        FROM: process.env.EMAIL_FROM || '"Museum Explorer Tickets" <no-reply@museumexplorer.in>'
    },
    WHATSAPP: {
        ENABLED: process.env.WHATSAPP_ENABLED === 'true',
        API_URL: process.env.WHATSAPP_API_URL || '',
        API_TOKEN: process.env.WHATSAPP_API_TOKEN || '',
        PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    }
};
