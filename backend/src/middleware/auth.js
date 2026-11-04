/*
    Authentication & Authorization Middleware.
    Intercepts incoming requests to verify JWTs and enforce role-based access control (RBAC).
    
    requireAuth: Checks if the request has a valid "Bearer" token (error 401 if missing/invalid).
    requireRole: Checks if the logged-in user has the correct role, like ADMIN or BUYER (error 403 if not).
    Author: Katarina Jane Jones
*/

const jwt = require("jsonwebtoken"); // imports the JWT library to verify tokens

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // fails if the secret is missing from .env
  throw new Error("JWT_SECRET is not set in .env");
}

// [!] error 401 = dont know who they are (no token or bad token)
// using this to protect any route that requires the user to be logged in
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" "); // splits "Bearer eyJ.." into ["Bearer", "eyJ..."]
  
  // expects the header to look exactly like "Bearer eyJhbGciOi.."
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    // checks if the token is valid and has not expired.
    const payload = jwt.verify(token, JWT_SECRET);
    
    // attaches the user's id and role to the request so the controller can use them
    // (this is why we can do req.user.id later)
    req.user = { id: payload.sub, role: payload.role };
    
    next(); // lets the request continue to the route/controller
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// [!] error 403 = know who they are but are not allowed. (wrong role)
// using this AFTER requireAuth, e.g. requireAuth, requireRole("ADMIN")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next(); // user has the right role, let them through!
  };
}

module.exports = { requireAuth, requireRole, JWT_SECRET }; // exports the middleware functions so that routes can use them