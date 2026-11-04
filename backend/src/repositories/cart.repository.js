/*
    SQL queries for the cart
    reads and writes to the carts and cart_items tables.
    one cart per buyer (enforced by carts.uq_carts_buyer), so upsertItem
    creates the cart if missing and increments the quantity if the product
    is already in it.

    Author: Katarina Jane Jones
*/
const pool = require("../db"); // imports the db

module.exports = {
  // returns all items in the buyer's cart with product details
  async findByBuyer(buyerId) {
    const sql = `
      SELECT
        ci.product_id, ci.quantity,
        p.name, p.sku, p.unit, p.wholesale_price, p.image_url,
        (ci.quantity * p.wholesale_price) AS line_total,
        COALESCE(s.available_quantity, 0) AS available_quantity
      FROM cart_items ci
      JOIN carts c    ON c.id = ci.cart_id
      JOIN products p ON p.id = ci.product_id
      LEFT JOIN product_stock s ON s.product_id = p.id
      WHERE c.buyer_id = ?
      ORDER BY ci.created_at ASC
    `;
    const [rows] = await pool.query(sql, [buyerId]);
    return rows;
  },

  // creates the cart if missing, then adds or increments the item 
  // because the cart might not be there until the customer adds an item.
  async upsertItem(buyerId, productId, quantity) {
    // ensure cart exists (UNIQUE buyer_id guarantees at most one row)
    await pool.query(
      `INSERT INTO carts (buyer_id) VALUES (?) ON DUPLICATE KEY UPDATE id=id`,
      [buyerId]
    );

    // fetch the cart id
    const [[{ id: cartId }]] = await pool.query(
      `SELECT id FROM carts WHERE buyer_id = ?`,
      [buyerId]
    );

    // insert or increment the quantity
    // runs when the user wants to add an item.
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, productId, quantity]
    );
  },

  // removes one product from the buyer's cart
  // runs when the user wants to remove an item.
  async removeItem(buyerId, productId) {
    await pool.query(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       WHERE c.buyer_id = ? AND ci.product_id = ?`,
      [buyerId, productId]
    );
  },
};
