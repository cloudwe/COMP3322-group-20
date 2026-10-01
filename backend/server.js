/* 
    Turns server on and picks a port to listen on.

    Author: Katarina Jane Jones

*/
require("dotenv").config(); // reads the dotenv file - important for DB_password and PORT to be accessible in code
const app = require("./app"); // app needed to define routes etc

const PORT = process.env.PORT || 3000; // picks port we are listening on - fallback is 3000 for local dev
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)); //starts HTTP server on our chosen port
