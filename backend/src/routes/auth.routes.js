/*
    Express routes for authentication.
    Maps the HTTP endpoints (/register, /login, /me) to their controller functions.
    The register and login routes are public, while /me is protected by the requireAuth middleware.    
    Author: Katarina Jane Jones
*/
const router = require("express").Router(); // creates a mini Express app just to handle auth routes, keeping app.js clean
const ctrl = require("../controllers/auth.controller"); // imports the controller (which handles the request logic itself)
const { requireAuth } = require("../middleware/auth"); // imports the requireAuth middleware (which checks the JWT token in the request header)

// public routes (anyone can acces (register & login)
router.post("/register", ctrl.register); // POST /auth/register (registers a new user)
router.post("/login", ctrl.login); // POST /auth/login (logs in a user and returns a JWT token)

// protected route (requireAuth checks the token first)
// GET /auth/me (returns the current user's info, only if logged in)
router.get("/me", requireAuth, ctrl.me); 

module.exports = router; // exports the router so that app.js can use it