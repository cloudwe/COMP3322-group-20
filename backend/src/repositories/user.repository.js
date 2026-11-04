/*
    SQL queries for the users table.
    Handles login, registration, and finding user details.
    Author: Katarina Jane Jones
*/

const pool = require("../db"); // imports MySQL connection pool

module.exports = {
  /*
    Used during login to check the password hash
   searches the users table for an exact email match to then get their password.
   */
  async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, role, business_name, contact_name, phone, status
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  /*
    Used by "GET /auth/me" and to return safe user data
    searches the users table for an exact id match to then get their details.
   */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, email, role, business_name, contact_name, phone, status, created_at
       FROM users WHERE id = ? LIMIT 1`, // we use limit 1 because we only want one row back, and it is faster than returning all rows.
      [id]
    ); 
    return rows[0] || null;
  },

  /*
    Used during registration
    inserts a new user into the users table.
   */
  async create({ email, passwordHash, contactName, businessName, phone, role }) {
    const [result] = await pool.query(
      `INSERT INTO users
         (email, password_hash, role, business_name, contact_name, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`, // uses ? for safer insertions (prevents ` etc to escape SQL query)
      [email, passwordHash, role, businessName || null, contactName, phone || null]
    ); // null because currently users do not need to provide business name etc.
    return result.insertId;
  },
};