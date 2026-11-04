/*
    Handles product HTTP requests and responses.
    
    Author: Katarina Jane Jones
    Bug fixes and edited: Ma tsz Hin
*/
const repo = require("../repositories/product.repository");

// GET /api/products
// returns every active product as a JSON array 
exports.list = async (req, res, next) => {
  try 
  {
    const products = await repo.findAll(); // find all products
    res.status(200).json(products); // status 200 - send
  } 
  catch (err) 
  {
    next(err);
  }
};

// GET /api/products/:id
exports.get = async (req, res, next) =>
    {
  try 
  {
    const product = await repo.findById(req.params.id); // find the product by ID

    // if no products found, report error.
    if (!product) return res.status(404).json({ error: "Product not found" });

    // else, no error.
    res.status(200).json(product);
  }
  catch (err)
  {
    next(err);
  }
};

// checks the body of a POST or PUT request.
// returns a message describing the problem, or null if the body is fine
function checkBody(body) {
  const { sku, name, unit, wholesale_price, category_id,
          minimum_order_quantity, reorder_level, is_perishable } = body;

  // text fields have to be non-empty strings
  for (const value of [sku, name, unit]) {
    if (typeof value !== "string" || !value.trim()) {
      return "sku, name and unit are required";
    }
  }

  // numbers have to be sent as numbers, not as text in quotes
  if (typeof wholesale_price !== "number" || !(wholesale_price >= 0)) {
    return "wholesale_price is required and must be 0 or more";
  }
  if (minimum_order_quantity !== undefined &&
      (typeof minimum_order_quantity !== "number" || !(minimum_order_quantity > 0))) {
    return "minimum_order_quantity must be more than 0";
  }
  if (reorder_level !== undefined &&
      (typeof reorder_level !== "number" || !(reorder_level >= 0))) {
    return "reorder_level must be 0 or more";
  }

  // category_id can be left out or null (no category)
  if (category_id !== undefined && category_id !== null && !Number.isInteger(category_id)) {
    return "category_id must be a whole number";
  }
  if (is_perishable !== undefined && typeof is_perishable !== "boolean") {
    return "is_perishable must be true or false";
  }
  return null;
}

// turns known database errors into proper responses
// returns true if it sent a response, false if the error is something else
function handleDbError(err, res) {
  if (err.code === "ER_DUP_ENTRY") {
    res.status(409).json({ error: "A product with this sku already exists" });
    return true;
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    res.status(400).json({ error: "category_id does not match any category" });
    return true;
  }
  if (err.code === "ER_DATA_TOO_LONG") {
    res.status(400).json({ error: "One of the text fields is too long" });
    return true;
  }
  return false;
}

// POST /api/products (admin only)
// adds a new product and returns it
exports.create = async (req, res, next) => {
  try {
    const body = req.body || {}; // body is undefined if the request had no JSON

    const problem = checkBody(body);
    if (problem) return res.status(400).json({ error: problem });

    const id = await repo.create(body);
    const product = await repo.findById(id);
    res.status(201).json(product);
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

// PUT /api/products/:id (admin only)
// replaces the product's details, so the body needs the same fields as POST
exports.update = async (req, res, next) => {
  try {
    const body = req.body || {};

    const problem = checkBody(body);
    if (problem) return res.status(400).json({ error: problem });

    if (!(await repo.findById(req.params.id))) {
      return res.status(404).json({ error: "Product not found" });
    }

    await repo.update(req.params.id, body);
    const product = await repo.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    if (handleDbError(err, res)) return;
    next(err);
  }
};

// PATCH /api/products/:id/deactivate (admin only)
// hides the product from the store, it will not show up in GET /api/products anymore
exports.deactivate = async (req, res, next) => {
  try {
    if (!(await repo.findById(req.params.id))) {
      return res.status(404).json({ error: "Product not found" });
    }

    await repo.deactivate(req.params.id);
    const product = await repo.findById(req.params.id);
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
};