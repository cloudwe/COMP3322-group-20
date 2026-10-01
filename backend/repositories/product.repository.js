/*
    SQL queries for the products table.
    Reads from the products table and the product_stock view.
    
    Author: Katarina Jane Jones
*/
const pool = require("../db"); // imports MySQL connection pool

module.exports =
 {
  async findAll() // async will promise, so the callers (await) will wait.
    // finds all active products from products table
    // uses LEFT JOIN so every product row is kept,
    // even if it has no category or no inventory batches yet
   {
    const sql = `
      SELECT
        p.id, p.category_id, p.sku, p.name, p.description,
        p.unit, p.wholesale_price, p.minimum_order_quantity,
        p.reorder_level, p.image_url, p.is_perishable, p.is_active,
        c.name AS category_name,
        COALESCE(s.available_quantity, 0) AS available_quantity,
        s.nearest_expiry_date
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_stock s ON s.product_id = p.id
      WHERE p.is_active = TRUE
      ORDER BY p.name ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

    // fetches one product from the database
    // uses LEFT JOIN so every product row is kept,
    // even if it has no category or no inventory batches yet
  async findById(id)
   {
    const sql = `
      SELECT
        p.id, p.category_id, p.sku, p.name, p.description,
        p.unit, p.wholesale_price, p.minimum_order_quantity,
        p.reorder_level, p.image_url, p.is_perishable, p.is_active,
        c.name AS category_name,
        COALESCE(s.available_quantity, 0) AS available_quantity,
        s.nearest_expiry_date
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_stock s ON s.product_id = p.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },
};

// TODO - add more SQL queries e.g., update()