/* 
    Handles authentication logic for FreshTrack.
        - register: creates new BUYER accounts (validates input, hashes password, never trusts client-asigned role)
        - login: verifies credentials, blocks suspended accounts, issues JWT...
        - me: returns the current user's profile for the frontend to determine role-based UI

    Author: Katarina Jane Jones

*/

const bcrypt = require("bcryptjs"); // hashing library used to scramble passwords before saving the password
const jwt = require("jsonwebtoken"); // // JWT library used to create signed login tokens
const userRepo = require("../repositories/user.repository"); // SQL queries for the users table
const { JWT_SECRET } = require("../middleware/auth");// the secret key used to sign/verify 

const BCRYPT_ROUNDS = 12; // how many times bcrypt scrambles the password (12 is the industry standard so thats why it is 12)
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || "2h"; // how long a token stays valid before the user must log in again

/*
    Creates a signed JWT containing the user's id and role.
    the frontend sends this back on every request to prove who they are.
*/
function issueToken(user) {
  // "sub" is the standard JWT name for the user's ID and "role" is our custom claim.
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/*
    Strips sensitive fields (like password_hash) before sending a user object to the frontend.
    never return the raw database row, it contains the hashed password.
*/
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    business_name: user.business_name,
    contact_name: user.contact_name,
    phone: user.phone,
    status: user.status,
  };
}

/*
    POST /api/auth/register
    creates a new BUYER account. ADMIN accounts can only be created via the seed script for now.
*/
exports.register = async (req, res, next) => {
  try {
    const { email, password, contact_name, business_name, phone } = req.body;

    if (!email || !password || !contact_name) {
      return res.status(400).json({ error: "email, password and contact_name are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (await userRepo.findByEmail(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = await userRepo.create({
      email,
      passwordHash,
      contactName: contact_name,
      businessName: business_name,
      phone,
      role: "BUYER", // hardcoded, never trusts req.body
    });

    const user = await userRepo.findById(id);
    return res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

/*
    POST /api/auth/login
    verifies email and password, then issues a JWT the frontend can use on future requests.
*/
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await userRepo.findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ error: "Account is suspended" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    return res.status(200).json({ token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

/*
    GET /api/auth/me
    returns the current logged-in user's info. used by the frontend on page load to decide which UI to render.
    this route is protected by requireAuth, so req.user is already set.
*/
exports.me = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "User not found or inactive" });
    }
    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};