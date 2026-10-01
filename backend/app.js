/* 
    Defines the Express app, middleware, and routes.
    
    Author: Katarina Jane Jones
*/
const express = require("express"); // imports Express library
const cors = require("cors"); //  imports Cors library
const app = express(); // instance of Express application
const productRoutes = require("./routes/product.routes"); // product routes (API endpoints)

app.use(cors()); // allows frontend (ran on different port) to call the API
app.use(express.json()); // we let Express read our JSON bodies from POST/PUT requests
app.use("/api/products", productRoutes);  // mounts 

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