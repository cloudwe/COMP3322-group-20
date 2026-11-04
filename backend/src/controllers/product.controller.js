/*
    Handles product HTTP requests and responses.
    
    Author: Katarina Jane Jones
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