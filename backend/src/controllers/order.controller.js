/*
    Handles order HTTP requests and responses.
    - create: a buyer checks out their cart
    - list / get: buyers see their own orders, admins see all of them
    - updateStatus: an admin moves an order along (shipped, delivered, cancelled)
    Author: Ma tsz Hin
*/
const repo = require("../repositories/order.repository");

const STATUSES = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

// POST /api/orders (buyer only)
// turns the buyer's cart into an order. body: { delivery_address, notes (optional) }
exports.create = async (req, res, next) => {
  try {
    const { delivery_address, notes } = req.body || {};

    // orders.delivery_address is VARCHAR(1000) and notes is VARCHAR(1000)
    if (typeof delivery_address !== "string" || !delivery_address.trim() || delivery_address.length > 1000) {
      return res.status(400).json({ error: "delivery_address is required (max 1000 characters)" });
    }
    if (notes != null && (typeof notes !== "string" || notes.length > 1000)) {
      return res.status(400).json({ error: "notes must be text (max 1000 characters)" });
    }

    // the buyer id comes from the token, never from the request body
    const orderId = await repo.createFromCart(req.user.id, delivery_address.trim(), notes?.trim() || null);
    const order = await repo.findById(orderId);
    res.status(201).json(order);
  } catch (err) {
    // errors from the repo that carry a status (empty cart, not enough stock...)
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

// GET /api/orders
// admin gets every order (can filter with ?status=SHIPPED), a buyer only gets their own
exports.list = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${STATUSES.join(", ")}` });
    }

    const isAdmin = req.user.role === "ADMIN";
    const orders = await repo.findAll({
      buyerId: isAdmin ? null : req.user.id,
      status,
    });
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
// returns one order with its items and status history
exports.get = async (req, res, next) => {
  try {
    const order = await repo.findById(req.params.id);

    // a buyer asking for someone else's order gets the same 404 as a missing order,
    // so they can't tell which order numbers exist
    const isAdmin = req.user.role === "ADMIN";
    if (!order || (!isAdmin && Number(order.buyer_id) !== Number(req.user.id))) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status (admin only)
// body: { status, note (optional) }
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body || {};

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${STATUSES.join(", ")}` });
    }
    if (note != null && (typeof note !== "string" || note.length > 500)) {
      return res.status(400).json({ error: "note must be text (max 500 characters)" });
    }

    await repo.changeStatus(req.params.id, status, req.user.id, note || null);
    const order = await repo.findById(req.params.id);
    res.status(200).json(order);
  } catch (err) {
    // 404 order not found, 409 status change not allowed
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};
