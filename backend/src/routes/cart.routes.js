/*
    Express routes for the buyer cart.
    maps the three cart URLs to their controller functions.
    all three are protected by requireAuth and requireRole("BUYER") in app.js,
    so only logged-in buyers can call them (admins get error 403).

    Author: Katarina Jane Jones
*/
const router = require("express").Router();// creates a mini Express app just for cart routes, keeping app.js clean
const ctrl = require("../controllers/cart.controller"); // imports the cart controller for list, add, remove

router.get("/", ctrl.list); // for GET /api/cart to view the buyers cart items and total
router.post("/", ctrl.add); // for POST /api/cart to add a product, or increment quantity if already in cart
router.delete("/:product_id", ctrl.remove); // for DELETE /api/cart/product_id to remove one product from the cart


module.exports = router;// exports the router so app.js can mount it at /api/cart