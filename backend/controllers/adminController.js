const { pool } = require('../config/db');

class AdminController {
    /**
     * Get Dashboard Summary Statistics
     */
    static async getStats(req, res, next) {
        try {
            const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
            const [[{ total_museums }]] = await pool.query('SELECT COUNT(*) as total_museums FROM museums');
            const [[{ total_bookings }]] = await pool.query('SELECT COUNT(*) as total_bookings FROM bookings');
            const [[{ total_revenue }]] = await pool.query("SELECT COALESCE(SUM(total_price), 0) as total_revenue FROM bookings WHERE booking_status = 'CONFIRMED'");
            const [[{ confirmed_bookings }]] = await pool.query("SELECT COUNT(*) as confirmed_bookings FROM bookings WHERE booking_status = 'CONFIRMED'");
            const [[{ cancelled_bookings }]] = await pool.query("SELECT COUNT(*) as cancelled_bookings FROM bookings WHERE booking_status = 'CANCELLED'");

            // Fetch recent 5 bookings
            const [recentBookings] = await pool.query(`
                SELECT 
                    b.id,
                    b.booking_reference,
                    u.username,
                    m.name AS museum_name,
                    b.visit_date,
                    b.total_price,
                    b.booking_status,
                    b.created_at
                FROM bookings b
                JOIN museums m ON b.museum_id = m.id
                JOIN users u ON b.user_id = u.id
                ORDER BY b.created_at DESC
                LIMIT 5
            `);

            res.status(200).json({
                success: true,
                stats: {
                    totalUsers: Number(total_users) || 0,
                    totalMuseums: Number(total_museums) || 0,
                    totalBookings: Number(total_bookings) || 0,
                    totalRevenue: parseFloat(total_revenue) || 0,
                    confirmedBookings: Number(confirmed_bookings) || 0,
                    cancelledBookings: Number(cancelled_bookings) || 0
                },
                recentBookings
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all users (sensitive fields like password_hash excluded)
     */
    static async getUsers(req, res, next) {
        try {
            const [users] = await pool.query(`
                SELECT id, username, email, role, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
            `);

            res.status(200).json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update user role (admin only)
     */
    static async updateUserRole(req, res, next) {
        try {
            const targetUserId = parseInt(req.params.id, 10);
            const { role } = req.body;

            if (!role || !['user', 'admin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role specified. Role must be either 'user' or 'admin'."
                });
            }

            // Prevent self-demotion
            if (targetUserId === req.user.id && role !== 'admin') {
                return res.status(400).json({
                    success: false,
                    message: "You cannot revoke your own administrator privileges."
                });
            }

            const [result] = await pool.query(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, targetUserId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: `User role updated successfully to '${role}'`
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all bookings across all users
     */
    static async getBookings(req, res, next) {
        try {
            const [bookings] = await pool.query(`
                SELECT 
                    b.id,
                    b.booking_reference,
                    b.user_id,
                    u.username,
                    u.email,
                    b.museum_id,
                    m.name AS museum_name,
                    m.city AS museum_city,
                    m.state AS museum_state,
                    b.visit_date,
                    b.adult_count,
                    b.child_count,
                    b.senior_count,
                    b.total_price,
                    b.booking_status,
                    b.created_at,
                    t.transaction_reference,
                    t.payment_method,
                    t.payment_status
                FROM bookings b
                JOIN museums m ON b.museum_id = m.id
                JOIN users u ON b.user_id = u.id
                LEFT JOIN transactions t ON b.id = t.booking_id
                ORDER BY b.created_at DESC
            `);

            res.status(200).json({
                success: true,
                count: bookings.length,
                data: bookings
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update booking status
     */
    static async updateBookingStatus(req, res, next) {
        try {
            const bookingId = parseInt(req.params.id, 10);
            const { status } = req.body;

            const allowed = ['CONFIRMED', 'CANCELLED', 'PENDING'];
            if (!status || !allowed.includes(status.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${allowed.join(', ')}`
                });
            }

            const normalizedStatus = status.toUpperCase();
            const [result] = await pool.query(
                'UPDATE bookings SET booking_status = ? WHERE id = ?',
                [normalizedStatus, bookingId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.status(200).json({
                success: true,
                message: `Booking #${bookingId} status updated to ${normalizedStatus}`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AdminController;
