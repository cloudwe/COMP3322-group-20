/*
    Defines product API endpoints.
    
    Author: Katarina Jane Jones
*/
const router = require("express").Router(); // mini express router to define routes
const ctrl = require("../controllers/product.controller"); // imports controller (which handles the request logic itself)

router.get("/", ctrl.list); // GET /api/products (returns all products)
router.get("/:id", ctrl.get); // GET /api/products/:id (returns one product)

module.exports = router; // exports so that app.js can use it.