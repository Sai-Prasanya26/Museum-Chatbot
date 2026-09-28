const { pool } = require('../config/db');

class BookingModel {
    static async create(data, conn = pool) {
        const sql = `
            INSERT INTO bookings 
            (booking_reference, user_id, visitor_name, visitor_email, visitor_phone, museum_id, visit_date, adult_count, child_count, senior_count, total_price, payment_status, payment_method, transaction_id, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.booking_reference,
            data.user_id,
            data.visitor_name || null,
            data.visitor_email || null,
            data.visitor_phone || null,
            data.museum_id,
            data.visit_date,
            data.adult_count,
            data.child_count,
            data.senior_count,
            data.total_price,
            data.payment_status || 'PENDING',
            data.payment_method || 'UPI',
            data.transaction_id || null,
            data.booking_status || 'CONFIRMED'
        ];
        const [result] = await conn.query(sql, params);
        return result.insertId;
    }

    static async getById(id) {
        const sql = `
            SELECT 
                b.id,
                b.booking_reference,
                b.user_id,
                b.visitor_name,
                b.visitor_email,
                b.visitor_phone,
                b.museum_id,
                m.name AS museum_name,
                m.city AS museum_city,
                m.state AS museum_state,
                m.image AS museum_image,
                m.opening_time,
                m.closing_time,
                b.visit_date,
                b.adult_count,
                b.child_count,
                b.senior_count,
                b.total_price,
                b.payment_status,
                b.payment_method,
                b.transaction_id,
                b.booking_status,
                b.created_at,
                COALESCE(b.transaction_id, t.transaction_reference) AS transaction_reference
            FROM bookings b
            JOIN museums m ON b.museum_id = m.id
            LEFT JOIN transactions t ON b.id = t.booking_id
            WHERE b.id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        return rows[0] || null;
    }

    static async getByReference(reference) {
        const sql = `
            SELECT 
                b.id,
                b.booking_reference,
                b.user_id,
                COALESCE(b.visitor_name, u.username) AS visitor_name,
                COALESCE(b.visitor_email, u.email) AS visitor_email,
                b.visitor_phone,
                u.username,
                u.email,
                b.museum_id,
                m.name AS museum_name,
                m.city AS museum_city,
                m.state AS museum_state,
                m.image AS museum_image,
                m.opening_time,
                m.closing_time,
                b.visit_date,
                b.adult_count,
                b.child_count,
                b.senior_count,
                b.total_price,
                b.payment_status,
                b.payment_method,
                b.transaction_id,
                b.booking_status,
                b.created_at,
                COALESCE(b.transaction_id, t.transaction_reference) AS transaction_reference
            FROM bookings b
            JOIN museums m ON b.museum_id = m.id
            JOIN users u ON b.user_id = u.id
            LEFT JOIN transactions t ON b.id = t.booking_id
            WHERE b.booking_reference = ?
        `;
        const [rows] = await pool.query(sql, [reference]);
        return rows[0] || null;
    }

    static async getByTransactionId(transactionId) {
        if (!transactionId) return null;
        const sql = `
            SELECT 
                b.id,
                b.booking_reference,
                b.user_id,
                b.visitor_name,
                b.visitor_email,
                b.visitor_phone,
                b.museum_id,
                m.name AS museum_name,
                m.city AS museum_city,
                m.state AS museum_state,
                b.visit_date,
                b.adult_count,
                b.child_count,
                b.senior_count,
                b.total_price,
                b.payment_status,
                b.payment_method,
                b.transaction_id,
                b.booking_status,
                b.created_at
            FROM bookings b
            JOIN museums m ON b.museum_id = m.id
            WHERE b.transaction_id = ?
            LIMIT 1
        `;
        const [rows] = await pool.query(sql, [transactionId]);
        return rows[0] || null;
    }

    static async getByUserId(userId) {
        const sql = `
            SELECT 
                b.id,
                b.booking_reference,
                b.visitor_name,
                b.visitor_email,
                b.visitor_phone,
                b.museum_id,
                m.name AS museum_name,
                m.city AS museum_city,
                m.state AS museum_state,
                m.image AS museum_image,
                b.visit_date,
                b.adult_count,
                b.child_count,
                b.senior_count,
                b.total_price,
                b.payment_status,
                b.payment_method,
                b.transaction_id,
                b.booking_status,
                b.created_at,
                COALESCE(b.transaction_id, t.transaction_reference) AS transaction_reference
            FROM bookings b
            JOIN museums m ON b.museum_id = m.id
            LEFT JOIN transactions t ON b.id = t.booking_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `;
        const [rows] = await pool.query(sql, [userId]);
        return rows;
    }

    static async updateStatus(id, bookingStatus, paymentStatus = null, conn = pool) {
        if (paymentStatus) {
            const [result] = await conn.query(
                'UPDATE bookings SET booking_status = ?, payment_status = ? WHERE id = ?',
                [bookingStatus, paymentStatus, id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await conn.query(
                'UPDATE bookings SET booking_status = ? WHERE id = ?',
                [bookingStatus, id]
            );
            return result.affectedRows > 0;
        }
    }

    static async cancel(id, userId, conn = pool) {
        const [result] = await conn.query(
            'UPDATE bookings SET booking_status = "CANCELLED", payment_status = "FAILED" WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = BookingModel;
