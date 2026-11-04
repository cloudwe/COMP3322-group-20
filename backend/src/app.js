/* 
    Defines the Express app, middleware, and routes.
    Author: Katarina Jane Jones
    Bug Fixes and edited: Ma tsz Hin
*/
const express = require("express"); // imports Express library
const cors = require("cors"); //  imports Cors library
const app = express(); // instance of Express application
const productRoutes = require("./routes/product.routes"); // product routes (API endpoints)
const authRoutes = require("./routes/auth.routes"); // [!] NEW: imports the auth routes
const { requireAuth, requireRole } = require("./middleware/auth"); // imports both the JWT checker and the role checker
const cartRoutes = require("./routes/cart.routes"); // [!] NEW: /imports the cart routes, which are GET, POST, DELETE /api/cart
const categoryRoutes = require("./routes/category.routes"); // categories (GET /api/categories)
const inventoryRoutes = require("./routes/inventory.routes"); // receiving stock (POST /api/inventory/batches)
const orderRoutes = require("./routes/order.routes"); // orders (the role checks for each route are inside order.routes.js)

app.use(cors()); // allows frontend (ran on different port) to call the API
app.use(express.json()); // lets Express read JSON bodies for POST requests (login/register)
// [!] NEW: auth routes (register/login are public, /me is protected)
app.use("/api/auth", authRoutes); 
// [!] MODIFIED: added requireAuth before productRoutes so a token is required
app.use("/api/products", requireAuth, productRoutes); 
// [!] NEW: requireRole("BUYER") ensures only buyers can use the cart (admins get 403)
app.use("/api/cart", requireAuth, requireRole("BUYER"), cartRoutes);
app.use("/api/categories", requireAuth, categoryRoutes); // any logged in user can read categories
app.use("/api/inventory", requireAuth, requireRole("ADMIN"), inventoryRoutes); // admins only
app.use("/api/orders", requireAuth, orderRoutes); // buyers and admins, orders are filtered by role in the controller

// confirms server is running do: http://localhost:3000/api/health (but docker needs to be running)
app.get("/api/health", (req, res) => { res.status(200).json({ status: "ok" });});

// 404: nothing matched the request path
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// 500: something threw an error inside a route
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app; // if another file asks for this file, we return app

// instructions for health check:
// run docker: docker compose up -d db 
// cd backend // so we can get into the backend directory
// npm run dev
// then in browser type: http://localhost:3000/api/health