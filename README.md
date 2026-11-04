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

This starts a MySQL version 8.4 container on port 3306 and automatically runs `db/schema.sql` on first launch.

## 2. Create the `.env` files (for Docker & Node.js)
*Note: the env files are not in the repository for privacy and security. The `DB_PASSWORD` and `JWT_SECRET` is not shared in the `README.md` but instead are filled with placeholders (`example1` and `example2`).*

i. Create the **first** `.env` file and ensure it contains the database credentials and a JWT secret under the `root` of the repository.
```env
DB_PASSWORD=example1
DB_NAME=freshtrack
```

ii. Create the **second** `.env` file and ensure it contains the database credentials and a JWT secret under the `root/backend` of the repository.
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=example1
DB_NAME=freshtrack
JWT_SECRET=example2 
JWT_EXPIRES_IN=2h
```

## 3. Starting the backend API
Run `cd backend` to ensure you are in the backend directory.

To ensure the database has the testing data run: `npm run seed`. (You only need to do this once.)

Then enter `npm run dev` to run the server on http://localhost:3000.

## 4. Testing the backend API
 Authentication is now implemented, so `/api/products` requires a JWT token. You cannot test the protected routes by simply typing the URL into a browser for all the commands. We recommend using `curl` in a second terminal window for testing that requires authentication.

## Browser testing:
1. `http://localhost:3000/api/health` should return `{"status":"ok"}` (does not require authentication).

2. `http://localhost:3000/api/products` should return `{"error":"Authentication required"}` because you are not signed in.

3. `http://localhost:3000/api/products/1` should return `{"error":"Authentication required"}` because you are not signed in.

## Terminal testing (Authentication Required)
Open another terminal and follow the commands below to setup the end-user environment. You would ideally use the frontend but it has not been fully integrated yet, so we are using `curl`.

**Preparation**
1. **Sign in** to get your access token by running: (This signs you into a testing buyer's account.)

```shell
curl -s -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"buyer@freshtrack.local","password":"Buyer123!"}'
```
You will receive a token, copy and paste it for every command by replacing `PASTE_TOKEN_HERE`. All commands now require a token for authentication.

**Testing**

### 1. **Search for all products** 
by running the command below but replace the token from the previous command into `PASTE_TOKEN_HERE`.
You should see a list of products fetched from the database (if database seed was run for testing.)

```shell
curl -i -H "Authorization: Bearer PASTE_TOKEN_HERE" http://localhost:3000/api/products
```


### 2. **Search for a product by ID** 
by running the command below but replace the token from the previous command into `PASTE_TOKEN_HERE`. You should see the correct product and its information fetched from the database (if database seed was run for testing.)

```shell
curl -i -H "Authorization: Bearer PASTE_TOKEN_HERE" http://localhost:3000/api/products/1
```

### 3. **Check your role** 
by running:
```shell
curl -i -H "Authorization: Bearer PASTE_TOKEN_HERE" http://localhost:3000/api/auth/me
```
This verifies if you are: `BUYER` or `ADMIN`. You should see `BUYER` for this command as we signed in as one. If the user is suspended, you would see the `{"error":"User not found or inactive"}` error message.

### 4. **Registering with a weak password** 
```shell
curl -i -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"weak@test.com","password":"123","contact_name":"Weak User"}'
```
Should return with `{"error":"Password must be at least 8 characters"}` because the password only has 3 characters. 

Currently, the password cannot be `null` or less than 8 characters.

### 5. Role Injection during registration
This test ensures that buyers cannot self-assign themselves as an admin to unlock extra privileges when signing up.

*Note: Ensure the email is unique before trying, otherwise you will get a `409 Email already registered error`.*

```shell
curl -s -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"hacker@test.com","password":"Password123","contact_name":"Hacker","role":"ADMIN"}'
```
 It should return `"role":"BUYER"` and not `"role":"ADMIN"` as the account has been made with the `BUYER` role.

### 6. Cannot sign in if account is suspended
Run the command below to sign in as a suspended user. Note that this account has been made for testing purposes and requires running the seed (`npm run seed`).
```shell
curl -i -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"suspended@freshtrack.local","password":"Suspended123!"}'
```
Running this should return `{"error":"Account is suspended"}`.

# API Endpoints (BETA version)
### Public Routes (No token required)
1. `GET /api/health`: Returns a HTTP status code 200 OK if server is running.
2. `POST /api/auth/register`: Registers a new BUYER account.
3. `POST /api/auth/login`: Authenticates user and returns a JWT token.

### Protected Routes (Requires `Authorization: Bearer <token>` header)
4. `GET /api/auth/me`: Returns the current logged-in user's profile.
5. `GET /api/products`: Returns all active products.
6. `GET /api/products/id`: Returns one product by ID.
