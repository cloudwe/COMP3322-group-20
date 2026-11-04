/*
    SQL queries for the categories table.
    Author: Ma tsz Hin
*/
const pool = require("../db"); // imports MySQL connection pool

module.exports = {
  // finds all active categories, sorted by name
  async findAll() {
    const sql = `
      SELECT id, name, slug, description
      FROM categories
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },
};
