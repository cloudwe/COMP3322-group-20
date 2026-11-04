# [GROUP 20] COMP3322 - Web Development and Technologies - FreshTrack
## Group 20 Members
| GitHub Username | Student Name |
|------|----------------|
| `cloudwe` | Katarina Jane Jones |
| `tse-brian` | Tse Chun Hong |
| `ericma0520` | Ma tsz Hin |
| `MPhantommaker` | Chan Long Him |


# Instructions - [BETA] Version
## 1. Starting the database
 Ensure you are at the project's root directory and run:\
`docker compose up -d db`

This starts a MySQL version 8.4 container and automatically runs `db/schema.sql` on first launch.

## 2. Create the `.env` files (for Docker & Node.js)
*Note: The `.env` files are not in the repository for privacy and security. You must create them locally.*

**i. Root Environment (for Docker)**
Create the **first** `.env` file under the `root` of the repository. You can do this by copying and filling the example template located in `root/templates`.

**ii. Backend Environment (for Node.js)**
Create the **second** `.env` file under the `root/backend` directory. You can do this by copying and filling the example template located under `backend/templates`.

## 3. Starting the backend API
Run `cd backend` to ensure you are in the backend directory.

Then enter `npm run dev` to run the server.

# Testing the backend API
 Authentication is now implemented, so most endpoints requires a JWT token. You cannot test the protected routes by simply typing the URL into a browser for all the commands. We recommend using `curl` in a second terminal window for testing that requires authentication.

# API Endpoints (BETA version)
### Public Routes (No token required)
1. `GET /api/health`, which returns 200 OK if the server is running.
2. `POST /api/auth/register`, which registers a new buyer account (role is hardcoded server-side).
3. `POST /api/auth/login`, which authenticates user and returns a JWT token.

### Protected Routes (Signed-in users only)
4. `GET /api/auth/me`, which returns the current logged-in user's profile.
5. `GET /api/products`, which returns all active products.
6. `GET /api/products/:id`, which returns one product by ID.

### Protected Routes (Buyer only)
7. `GET /api/cart`, which returns the buyer's cart items and subtotal.
8. `POST /api/cart`, which adds a product (or increments quantity). Body: `{ product_id, quantity }`.
9. `DELETE /api/cart/:product_id`, which removes one product from the cart.