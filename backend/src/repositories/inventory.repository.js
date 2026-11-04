/*
    SQL queries for inventory batches (each delivery of stock is one batch).
    Stock levels are not stored on the product, they are worked out from the batches,
    so receiving stock means adding a batch.
    Author: Ma tsz Hin
*/
const pool = require("../db"); // imports MySQL connection pool

module.exports = {
  // saves a new batch and writes a RECEIPT line in the stock history.
  // both inserts use the same connection and are wrapped in a transaction,
  // so if the second one fails the first one is undone too.
  // returns the new batch's id
  async createBatch(b) {
    const conn = await pool.getConnection(); // a transaction needs one connection for all its queries
    try {
      await conn.beginTransaction();

      // current_quantity starts equal to received_quantity (nothing has been sold yet)
      const [result] = await conn.query(
        `INSERT INTO inventory_batches
           (product_id, batch_code, supplier_name, received_quantity,
            current_quantity, unit_cost, expires_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.productId, b.batchCode, b.supplierName, b.quantity, b.quantity,
         b.unitCost, b.expiresAt, b.userId]
      );

      await conn.query(
        `INSERT INTO inventory_movements
           (inventory_batch_id, product_id, movement_type, quantity_change, reason, performed_by)
         VALUES (?, ?, 'RECEIPT', ?, 'Stock received', ?)`,
        [result.insertId, b.productId, b.quantity, b.userId]
      );

      await conn.commit(); // saves both inserts
      return result.insertId;
    } catch (err) {
      await conn.rollback(); // undoes anything saved so far
      throw err;
    } finally {
      conn.release(); // gives the connection back to the pool (always, even after an error)
    }
  },

  // fetches one batch with its product's sku and name
  // DATE_FORMAT keeps expires_at as plain text like 2026-12-31
  // (otherwise it turns into a JS date and can show up a day early)
  async findById(id) {
    const sql = `
      SELECT
        b.id, b.product_id, p.sku, p.name AS product_name, b.batch_code,
        b.supplier_name, b.received_quantity, b.current_quantity, b.unit_cost,
        b.received_at, DATE_FORMAT(b.expires_at, '%Y-%m-%d') AS expires_at
      FROM inventory_batches b
      JOIN products p ON p.id = b.product_id
      WHERE b.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  },
};
