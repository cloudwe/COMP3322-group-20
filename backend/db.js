/* 
    Creates and exports a single MYSQL connection pool for the entire backend.
    This pool is created when the app starts and stays alive for the lifetime of the Node process.
    
    Author: Katarina Jane Jones

*/

const mysql = require("mysql2/promise"); // promise version - for async/wait methods

const pool = mysql.createPool({ // note: does not connect to MySQL immediately.
  host: process.env.DB_HOST || "localhost", // MySQL lives
  port: process.env.DB_PORT || 3306, // default MySQL port
  user: process.env.DB_USER || "root", 
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "freshtrack", // database - freshtrack
  waitForConnections: true, // wait for connections in queue
  connectionLimit: 10, // 10 connection limit
  queueLimit: 0, // no limit on the queue (may need to change later)
  decimalNumbers: true, // ensuring DECIMALS come back as js numbers to prevent errors
});

module.exports = pool; // allows other files to use the pool.