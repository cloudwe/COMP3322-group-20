/*
    Defines product API endpoints.
    
    Author: Katarina Jane Jones
    Bug Fixes and edited: Ma tsz Hin
*/
const router = require("express").Router(); // mini express router to define routes
const ctrl = require("../controllers/product.controller"); // imports controller (which handles the request logic itself)
const { requireRole } = require("../middleware/auth"); // checks the user's role (requireAuth already ran in app.js)

router.get("/", ctrl.list); // GET /api/products (returns all products)
router.get("/:id", ctrl.get); // GET /api/products/:id (returns one product)

// admin only
router.post("/", requireRole("ADMIN"), ctrl.create); // POST /api/products (adds a product)
router.put("/:id", requireRole("ADMIN"), ctrl.update); // PUT /api/products/:id (edits a product)
router.patch("/:id/deactivate", requireRole("ADMIN"), ctrl.deactivate); // PATCH /api/products/:id/deactivate (hides a product)

module.exports = router; // exports so that app.js can use it. 