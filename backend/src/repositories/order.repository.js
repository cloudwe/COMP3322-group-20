/*
    SQL queries for orders and order items.
    Placing an order and changing its status both change several tables at once
    (orders, order items, stock batches, stock history), so those two run inside
    a transaction: either every query is saved or none of them are.
    Author: Ma tsz Hin
*/
const crypto = require("crypto");
const pool = require("../db"); // imports MySQL connection pool

// which status changes are allowed (DELIVERED and CANCELLED are final)
const NEXT_STATUS = {
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// makes an error with a status code, so the controller knows what to send back
// (for example 409 when there is not enough stock)
function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

module.exports = {
  // turns the buyer's cart into an order, returns the new order's id.
  // steps: read the cart, check each line, pick the stock batches (FEFO),
  // save the order, take the stock out, empty the cart.
  async createFromCart(buyerId, deliveryAddress, notes) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. read the cart with the current product details.
      // FOR UPDATE OF ci locks the cart rows, so a double click can't check out the same cart twice.
      // sorted by product_id so every checkout locks things in the same order (avoids deadlocks)
      const [cart] = await conn.query(
        `SELECT ci.product_id, ci.quantity,
                p.sku, p.name, p.unit, p.wholesale_price,
                p.minimum_order_quantity, p.is_active
         FROM cart_items ci
         JOIN carts c    ON c.id = ci.cart_id
         JOIN products p ON p.id = ci.product_id
         WHERE c.buyer_id = ?
         ORDER BY ci.product_id
         FOR UPDATE OF ci`,
        [buyerId]
      );
      if (cart.length === 0) throw fail(400, "Your cart is empty");

      // 2. check every line and work out which batches the stock will come from.
      // nothing is saved yet, so if a line fails the whole order stops
      let subtotal = 0;
      const lines = [];
      for (const item of cart) {
        if (!item.is_active) {
          throw fail(400, `${item.name} is no longer available, please remove it from your cart`);
        }
        if (item.quantity < item.minimum_order_quantity) {
          throw fail(400, `Minimum order quantity for ${item.name} is ${item.minimum_order_quantity}`);
        }

        // FEFO = first expiry, first out. batches that expire soonest come first,
        // batches with no expiry date come last and expired batches are skipped.
        // FOR UPDATE locks these batches so another buyer can't take the same stock at the same time
        const [batches] = await conn.query(
          `SELECT id, current_quantity
           FROM inventory_batches
           WHERE product_id = ? AND current_quantity > 0
             AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
           ORDER BY expires_at IS NULL, expires_at ASC, received_at ASC
           FOR UPDATE`,
          [item.product_id]
        );

        // take stock from the first batch, then the next one, until we have enough
        let remaining = item.quantity;
        const allocations = [];
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.current_quantity);
          allocations.push({ batchId: batch.id, quantity: take });
          remaining = round3(remaining - take);
        }
        if (remaining > 0) throw fail(409, `Not enough stock for ${item.name}`);

        // the price always comes from the products table, never from the client
        const lineTotal = round2(item.quantity * item.wholesale_price);
        subtotal = round2(subtotal + lineTotal);
        lines.push({ item, lineTotal, allocations });
      }

      // 3. save the order header. status starts as PROCESSING (the table default)
      const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      const orderNumber = `FT-${today}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const [orderResult] = await conn.query(
        `INSERT INTO orders (order_number, buyer_id, subtotal, notes, delivery_address)
         VALUES (?, ?, ?, ?, ?)`,
        [orderNumber, buyerId, subtotal, notes, deliveryAddress]
      );
      const orderId = orderResult.insertId;

      // 4. save each line, then take its stock out of the chosen batches
      for (const { item, lineTotal, allocations } of lines) {
        // name, sku, unit and price are copied so the order stays the same even if the product changes later
        const [itemResult] = await conn.query(
          `INSERT INTO order_items
             (order_id, product_id, sku_snapshot, product_name_snapshot,
              unit_snapshot, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.sku, item.name, item.unit,
           item.wholesale_price, item.quantity, lineTotal]
        );

        for (const a of allocations) {
          // remembers which batch this line used (needed to put the stock back if the order is cancelled)
          await conn.query(
            `INSERT INTO order_item_batches (order_item_id, inventory_batch_id, allocated_quantity)
             VALUES (?, ?, ?)`,
            [itemResult.insertId, a.batchId, a.quantity]
          );
          await conn.query(
            "UPDATE inventory_batches SET current_quantity = current_quantity - ? WHERE id = ?",
            [a.quantity, a.batchId]
          );
          // negative number = stock leaving
          await conn.query(
            `INSERT INTO inventory_movements
               (inventory_batch_id, product_id, order_id, movement_type, quantity_change, performed_by)
             VALUES (?, ?, ?, 'SALE', ?, ?)`,
            [a.batchId, item.product_id, orderId, -a.quantity, buyerId]
          );
        }
      }

      // 5. first line of the order's status history
      await conn.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
         VALUES (?, NULL, 'PROCESSING', ?, 'Order placed')`,
        [orderId, buyerId]
      );

      // 6. the cart has been turned into an order, so empty it
      await conn.query(
        `DELETE ci FROM cart_items ci
         JOIN carts c ON c.id = ci.cart_id
         WHERE c.buyer_id = ?`,
        [buyerId]
      );

      await conn.commit();
      return orderId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // finds orders, newest first. pass a buyerId to only get that buyer's orders,
  // and/or a status to filter by status
  async findAll({ buyerId, status }) {
    // only fixed text goes into the WHERE, the values themselves still use ? placeholders
    const where = [];
    const params = [];
    if (buyerId) {
      where.push("o.buyer_id = ?");
      params.push(buyerId);
    }
    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }

    const sql = `
      SELECT
        o.id, o.order_number, o.buyer_id, u.business_name, u.contact_name,
        o.status, o.subtotal, o.delivery_address, o.notes,
        o.placed_at, o.shipped_at, o.delivered_at, o.cancelled_at
      FROM orders o
      JOIN users u ON u.id = o.buyer_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY o.placed_at DESC, o.id DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // fetches one order with its items and its status history
  async findById(id) {
    const [orders] = await pool.query(
      `SELECT
         o.id, o.order_number, o.buyer_id, u.business_name, u.contact_name,
         o.status, o.subtotal, o.delivery_address, o.notes,
         o.placed_at, o.shipped_at, o.delivered_at, o.cancelled_at
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       WHERE o.id = ?`,
      [id]
    );
    if (orders.length === 0) return null;

    const [items] = await pool.query(
      `SELECT product_id, sku_snapshot AS sku, product_name_snapshot AS name,
              unit_snapshot AS unit, unit_price, quantity, line_total
       FROM order_items
       WHERE order_id = ?
       ORDER BY id`,
      [id]
    );

    const [history] = await pool.query(
      `SELECT from_status, to_status, changed_by, note, changed_at
       FROM order_status_history
       WHERE order_id = ?
       ORDER BY id`,
      [id]
    );

    return { ...orders[0], items, history };
  },

  // moves an order to a new status (admin action).
  // cancelling also puts the stock back into the batches it was taken from
  async changeStatus(orderId, newStatus, adminId, note) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // lock the order so two admins can't change it at the same moment
      const [[order]] = await conn.query(
        "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
        [orderId]
      );
      if (!order) throw fail(404, "Order not found");
      if (!NEXT_STATUS[order.status].includes(newStatus)) {
        throw fail(409, `An order that is ${order.status} cannot be changed to ${newStatus}`);
      }

      // IF() only fills in the timestamp that belongs to the new status
      await conn.query(
        `UPDATE orders
         SET status = ?,
             shipped_at   = IF(? = 'SHIPPED',   NOW(), shipped_at),
             delivered_at = IF(? = 'DELIVERED', NOW(), delivered_at),
             cancelled_at = IF(? = 'CANCELLED', NOW(), cancelled_at)
         WHERE id = ?`,
        [newStatus, newStatus, newStatus, newStatus, order.id]
      );

      if (newStatus === "CANCELLED") {
        // order_item_batches says exactly how much came out of which batch
        const [allocations] = await conn.query(
          `SELECT oib.inventory_batch_id, oib.allocated_quantity, oi.product_id
           FROM order_item_batches oib
           JOIN order_items oi ON oi.id = oib.order_item_id
           WHERE oi.order_id = ?
           ORDER BY oib.inventory_batch_id`,
          [order.id]
        );

        for (const a of allocations) {
          await conn.query(
            "UPDATE inventory_batches SET current_quantity = current_quantity + ? WHERE id = ?",
            [a.allocated_quantity, a.inventory_batch_id]
          );
          // positive number = stock coming back
          await conn.query(
            `INSERT INTO inventory_movements
               (inventory_batch_id, product_id, order_id, movement_type, quantity_change, reason, performed_by)
             VALUES (?, ?, ?, 'RETURN', ?, 'Order cancelled', ?)`,
            [a.inventory_batch_id, a.product_id, order.id, a.allocated_quantity, adminId]
          );
        }
      }

      await conn.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
         VALUES (?, ?, ?, ?, ?)`,
        [order.id, order.status, newStatus, adminId, note]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};
