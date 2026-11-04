/*
    Handles cart logic for buyers.
    - list: returns all items in the buyer's cart and subtotal
    - add: adds a product or increments quantity if already in cart
    - remove: deletes one product from the cart

    Author: Katarina Jane Jones
*/
const repo = require("../repositories/cart.repository");
const productRepo = require("../repositories/product.repository");

// GET /api/cart
// returns the buyers cart items and the total cost
exports.list = async (req, res, next) => {
  try {
    // req.user.id comes from the JWT, set by requireAuth middleware
    const items = await repo.findByBuyer(req.user.id);

    // subtotal is the sum of all line_total values (line_total is quantity * wholesale_price)
    const subtotal = items.reduce((sum, i) => sum + Number(i.line_total), 0);

    return res.status(200).json({ items, subtotal });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart
// adds a product to the cart, or increments the quantity if its already there
exports.add = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    // checks if the product id and quantity are positive numbers
    const qty = Number(quantity);
    if (!product_id || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "product_id and a positive quantity are required" });
    }

    // checking the product exists and is still active
    const product = await productRepo.findById(product_id);
    if (!product || !product.is_active) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ensuring the products minimum order quantity
    if (qty < Number(product.minimum_order_quantity)) {
      return res.status(400).json({
        error: `Minimum order quantity for this product is ${product.minimum_order_quantity}`,
      });
    }

    // insert or increment in the cart_items table
    await repo.upsertItem(req.user.id, product_id, qty);

    // return the updated cart for the frontend
    const items = await repo.findByBuyer(req.user.id);
    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/:product_id
// removes one specific product from the buyers cart
exports.remove = async (req, res, next) => {
  try {
    // req.params.product_id is the URL segment, like from /api/cart/5 to "5"
    await repo.removeItem(req.user.id, req.params.product_id);

    // return the updated cart for the frontend
    const items = await repo.findByBuyer(req.user.id);
    return res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};