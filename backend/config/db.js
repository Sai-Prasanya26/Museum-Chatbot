const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
    host: config.DB.HOST,
    port: config.DB.PORT,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    waitForConnections: true,
    connectionLimit: config.DB.CONNECTION_LIMIT,
    queueLimit: 0,
    decimalNumbers: true
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`[Database] MySQL Connected Successfully to database "${config.DB.NAME}" on ${config.DB.HOST}:${config.DB.PORT}`);
        connection.release();
        return true;
    } catch (err) {
        console.error('[Database] MySQL Connection Failed:', err.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
