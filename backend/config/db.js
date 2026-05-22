const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_portal',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  dateStrings: true,
  multipleStatements: false,
});

async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    // MySQL 8 refuses to bind LIMIT/OFFSET as prepared params
    // (ER_WRONG_ARGUMENTS / errno 1210). Fall back to unprepared query.
    if (err && (err.errno === 1210 || err.code === 'ER_WRONG_ARGUMENTS')) {
      const [rows] = await pool.query(sql, params);
      return rows;
    }
    throw err;
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, query, queryOne };
