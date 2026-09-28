const { pool } = require('../config/db');

class MuseumModel {
    static async getAll(filters = {}) {
        let sql = 'SELECT * FROM museums WHERE 1=1';
        const params = [];

        if (filters.state) {
            sql += ' AND LOWER(state) = LOWER(?)';
            params.push(filters.state.trim());
        }

        if (filters.city) {
            sql += ' AND LOWER(city) = LOWER(?)';
            params.push(filters.city.trim());
        }

        if (filters.search) {
            sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(city) LIKE LOWER(?) OR LOWER(state) LIKE LOWER(?))';
            const term = `%${filters.search.trim()}%`;
            params.push(term, term, term);
        }

        sql += ' ORDER BY state ASC, name ASC';

        if (filters.limit) {
            const limit = parseInt(filters.limit, 10);
            const offset = parseInt(filters.offset, 10) || 0;
            sql += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query('SELECT * FROM museums WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async getByName(name) {
        const [rows] = await pool.query('SELECT * FROM museums WHERE LOWER(name) = LOWER(?)', [name.trim()]);
        return rows[0] || null;
    }

    static async search(query) {
        const term = `%${query.trim()}%`;
        const [rows] = await pool.query(
            `SELECT * FROM museums 
             WHERE LOWER(name) LIKE LOWER(?) 
                OR LOWER(city) LIKE LOWER(?) 
                OR LOWER(state) LIKE LOWER(?) 
                OR LOWER(description) LIKE LOWER(?)
             ORDER BY name ASC`,
            [term, term, term, term]
        );
        return rows;
    }

    static async getByState(state) {
        const [rows] = await pool.query(
            'SELECT * FROM museums WHERE LOWER(state) = LOWER(?) ORDER BY name ASC',
            [state.trim()]
        );
        return rows;
    }

    static async getDistinctStates() {
        const [rows] = await pool.query(
            'SELECT DISTINCT state FROM museums WHERE state IS NOT NULL AND state != "" ORDER BY state ASC'
        );
        return rows.map(r => r.state);
    }

    static async create(data) {
        const sql = `
            INSERT INTO museums 
            (name, state, city, description, opening_time, closing_time, adult_price, child_price, senior_price, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.name.trim(),
            data.state.trim(),
            data.city ? data.city.trim() : '',
            data.description || '',
            data.opening_time || '09:00 AM',
            data.closing_time || '05:30 PM',
            data.adult_price || 150.00,
            data.child_price || 75.00,
            data.senior_price || 100.00,
            data.image || 'assets/images/default.jpg'
        ];
        const [result] = await pool.query(sql, params);
        return this.getById(result.insertId);
    }

    static async update(id, data) {
        const sql = `
            UPDATE museums 
            SET name = COALESCE(?, name),
                state = COALESCE(?, state),
                city = COALESCE(?, city),
                description = COALESCE(?, description),
                opening_time = COALESCE(?, opening_time),
                closing_time = COALESCE(?, closing_time),
                adult_price = COALESCE(?, adult_price),
                child_price = COALESCE(?, child_price),
                senior_price = COALESCE(?, senior_price),
                image = COALESCE(?, image)
            WHERE id = ?
        `;
        const params = [
            data.name,
            data.state,
            data.city,
            data.description,
            data.opening_time,
            data.closing_time,
            data.adult_price,
            data.child_price,
            data.senior_price,
            data.image,
            id
        ];
        await pool.query(sql, params);
        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM museums WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM museums');
        return rows[0].count;
    }
}

module.exports = MuseumModel;
