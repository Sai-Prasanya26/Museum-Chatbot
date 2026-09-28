const { pool } = require('../config/db');

async function migrate() {
    console.log('[Migration] Checking bookings table schema...');
    const conn = await pool.getConnection();
    try {
        const [cols] = await conn.query('DESCRIBE bookings');
        const colNames = cols.map(c => c.Field);
        
        if (!colNames.includes('visitor_name')) {
            await conn.query('ALTER TABLE bookings ADD COLUMN visitor_name VARCHAR(150) NULL AFTER user_id');
            console.log('[Migration] Added visitor_name column');
        }
        if (!colNames.includes('visitor_email')) {
            await conn.query('ALTER TABLE bookings ADD COLUMN visitor_email VARCHAR(150) NULL AFTER visitor_name');
            console.log('[Migration] Added visitor_email column');
        }
        if (!colNames.includes('visitor_phone')) {
            await conn.query('ALTER TABLE bookings ADD COLUMN visitor_phone VARCHAR(50) NULL AFTER visitor_email');
            console.log('[Migration] Added visitor_phone column');
        }
        if (!colNames.includes('payment_status')) {
            await conn.query("ALTER TABLE bookings ADD COLUMN payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING' AFTER total_price");
            console.log('[Migration] Added payment_status column');
        }
        if (!colNames.includes('payment_method')) {
            await conn.query("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT 'UPI' AFTER payment_status");
            console.log('[Migration] Added payment_method column');
        }
        if (!colNames.includes('transaction_id')) {
            await conn.query('ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(100) NULL AFTER payment_method');
            console.log('[Migration] Added transaction_id column');
        }

        // Ensure enum for booking_status has PENDING, CONFIRMED, CANCELLED
        await conn.query("ALTER TABLE bookings MODIFY COLUMN booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING'");
        console.log('[Migration] Updated booking_status enum');

        const [finalCols] = await conn.query('DESCRIBE bookings');
        console.log('[Migration] Final bookings columns:', finalCols.map(c => c.Field));
    } catch (err) {
        console.error('[Migration] Migration error:', err);
        throw err;
    } finally {
        conn.release();
    }
}

migrate()
    .then(() => {
        console.log('[Migration] Successfully updated database schema!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('[Migration] Failed:', err);
        process.exit(1);
    });
