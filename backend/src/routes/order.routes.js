/*
    Defines order API endpoints.
    requireAuth already ran in app.js, so req.user is set here.
    Author: Ma tsz Hin
*/
const router = require("express").Router();
const ctrl = require("../controllers/order.controller");
const { requireRole } = require("../middleware/auth"); // checks the user's role

router.post("/", requireRole("BUYER"), ctrl.create); // POST /api/orders (buyer checks out their cart)
router.get("/", ctrl.list); // GET /api/orders (admin: all orders, buyer: their own)
router.get("/:id", ctrl.get); // GET /api/orders/:id (one order)
router.patch("/:id/status", requireRole("ADMIN"), ctrl.updateStatus); // PATCH /api/orders/:id/status (admin only)

module.exports = router;
