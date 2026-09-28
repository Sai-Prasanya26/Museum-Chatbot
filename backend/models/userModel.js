const { pool } = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT id, username, email, password_hash, role, created_at, updated_at FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async create({ username, email, password_hash, role = 'user' }) {
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username.trim(), email.toLowerCase().trim(), password_hash, role]
        );
        return {
            id: result.insertId,
            username: username.trim(),
            email: email.toLowerCase().trim(),
            role
        };
    }
}

module.exports = UserModel;
