const { pool } = require('../config/db');

class TransactionModel {
    static async create(data, conn = pool) {
        const sql = `
            INSERT INTO transactions 
            (transaction_reference, booking_id, user_id, amount, payment_method, payment_status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.transaction_reference,
            data.booking_id,
            data.user_id,
            data.amount,
            data.payment_method || 'UPI',
            data.payment_status || 'SUCCESS'
        ];
        const [result] = await conn.query(sql, params);
        return result.insertId;
    }

    static async getByReference(reference) {
        const [rows] = await pool.query(
            'SELECT * FROM transactions WHERE transaction_reference = ?',
            [reference]
        );
        return rows[0] || null;
    }

    static async getByBookingId(bookingId) {
        const [rows] = await pool.query(
            'SELECT * FROM transactions WHERE booking_id = ? ORDER BY created_at DESC',
            [bookingId]
        );
        return rows[0] || null;
    }

    static async updateStatus(id, status, conn = pool) {
        const [result] = await conn.query(
            'UPDATE transactions SET payment_status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = TransactionModel;
