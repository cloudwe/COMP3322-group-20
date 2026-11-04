/*
    Handles inventory HTTP requests and responses.
    Only admins can reach these (checked in app.js).
    Author: Ma tsz Hin
*/
const repo = require("../repositories/inventory.repository");
const productRepo = require("../repositories/product.repository");

// true if the text is a real date written like 2026-12-31
// (new Date quietly turns 2026-02-31 into March, so we compare it back to the original text)
function isRealDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(text);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

// POST /api/inventory/batches
// records a delivery of stock for one product and returns the new batch
exports.receive = async (req, res, next) => {
  try {
    const { product_id, batch_code, quantity, supplier_name, unit_cost, expires_at } = req.body || {};

    if (!Number.isInteger(product_id) || typeof batch_code !== "string" || !batch_code.trim() ||
        typeof quantity !== "number" || !(quantity > 0)) {
      return res.status(400).json({ error: "product_id, batch_code and a positive quantity are required" });
    }
    if (unit_cost != null && (typeof unit_cost !== "number" || !(unit_cost >= 0))) {
      return res.status(400).json({ error: "unit_cost must be 0 or more" });
    }
    if (expires_at != null && !isRealDate(expires_at)) {
      return res.status(400).json({ error: "expires_at must be a real date like 2026-12-31" });
    }

    const product = await productRepo.findById(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // the schema only allows an empty expiry date for products that never expire
    if (product.is_perishable && !expires_at) {
      return res.status(400).json({ error: "expires_at is required for perishable products" });
    }

    const id = await repo.createBatch({
      productId: product_id,
      batchCode: batch_code.trim(),
      supplierName: supplier_name ?? null,
      quantity,
      unitCost: unit_cost ?? null,
      expiresAt: expires_at ?? null,
      userId: req.user.id, // the admin who received it, from the token
    });

    const batch = await repo.findById(id);
    res.status(201).json(batch);
  } catch (err) {
    // the same product can't have two batches with the same batch_code
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "This product already has a batch with that batch_code" });
    }
    if (err.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({ error: "batch_code or supplier_name is too long" });
    }
    next(err);
  }
};
