/*
    SQL queries for the products table.
    Reads from the products table and the product_stock view.
    
    Author: Katarina Jane Jones
    Bug fix and edited: Ma tsz Hin
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

  // adds a new product, returns the new product's id
  // fields the admin left out get the same defaults as the database table
  async create(p) {
    const sql = `
      INSERT INTO products
        (category_id, sku, name, description, unit, wholesale_price,
         minimum_order_quantity, reorder_level, image_url, is_perishable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, columnValues(p));
    return result.insertId;
  },

  // replaces every editable field of one product
  async update(id, p) {
    const sql = `
      UPDATE products
      SET category_id = ?, sku = ?, name = ?, description = ?, unit = ?,
          wholesale_price = ?, minimum_order_quantity = ?, reorder_level = ?,
          image_url = ?, is_perishable = ?
      WHERE id = ?
    `;
    await pool.query(sql, [...columnValues(p), id]);
  },

  // hides a product from the store without deleting it,
  // old orders still point at the product so the row has to stay
  async deactivate(id) {
    await pool.query("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);
  },
};

// turns the request body into the list of values for create() and update()
// (the order has to match the columns in the SQL above)
function columnValues(p) {
  return [
    p.category_id ?? null,
    p.sku.trim(),
    p.name.trim(),
    p.description ?? null,
    p.unit.trim(),
    p.wholesale_price,
    p.minimum_order_quantity ?? 1,
    p.reorder_level ?? 0,
    p.image_url ?? null,
    p.is_perishable ?? true,
  ];
}