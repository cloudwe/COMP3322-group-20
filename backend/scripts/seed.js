require("dotenv").config(); // loads .env variables (DB_PASSWORD, etc.)
const bcrypt = require("bcryptjs"); // using bcryptjs to avoid node-gyp build errors
const pool = require("../src/db"); // imports MySQL connection pool

// helper function to create a user or update their password if they already exist
async function upsertUser({ email, password, role, contactName, businessName, status = "ACTIVE" }) {
  const hash = await bcrypt.hash(password, 12); // hashes the password before saving
  await pool.query(
    `INSERT INTO users (email, password_hash, role, contact_name, business_name, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       password_hash = VALUES(password_hash), 
       role = VALUES(role),
       status = VALUES(status)`, // updates status if the user already exists
    [email, hash, role, contactName, businessName, status]
  );
  console.log(`seeded ${role} <${email}>`);
}

(async () => {
  try {
    // creating the admin account
    await upsertUser({
      email: "admin@freshtrack.local",
      password: "Admin123!",
      role: "ADMIN",
      contactName: "FreshTrack Admin",
      businessName: "FreshTrack",
    });
    
    // creating a test buyer account
    await upsertUser({
      email: "buyer@freshtrack.local",
      password: "Buyer123!",
      role: "BUYER",
      contactName: "Test Buyer",
      businessName: "Test Restaurant",
    });

    // seed a suspended user for security testing
    await upsertUser({
      email: "suspended@freshtrack.local",
      password: "Suspended123!",
      role: "BUYER",
      contactName: "Suspended Buyer",
      businessName: "Suspended Restaurant",
      status: "SUSPENDED", //forces this account to be banned!!
    });
    
    await pool.end(); // closing the database connection
    console.log("seed complete");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();