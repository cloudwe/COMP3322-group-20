# [GROUP 20] COMP3322 - Web Development and Technologies.
# FreshTrack
*TODO* - Make introduction with usernames.

# Instructions - [ALPHA] Version
## 1. Starting the database
 Ensure you are at the project's root directory and run:\
`docker compose up -d db`

This starts a MySQL version 8.4 container on port 3306 and automatically runs db/schema.sql on first launch.

## 2. Starting the backend API
Run `cd backend` to ensure you are in the backend directory.

Then enter `npm run dev` to run the server on http://localhost:3000.

## 3. Testing the backend API
Once you have executed steps 1 and 2, you can test the Alpha version of our backend by entering the below URLs into your browser:

`http://localhost:3000/api/health` : should return `{"status":"ok"}` 

`http://localhost:3000/api/products` : list of products from the database

`http://localhost:3000/api/products/1` : one product or a 404 not found error (including if there are no product entries).

Anything else should return a 404 not found error.


# API Endpoints
Currently, the below API endpoints are functional:
1. `GET	/api/health`: Returns a HTTP status code 200 OK if server is running
2. `GET	/api/products`: Returns all active products
3. `GET	/api/products/id`: Returns one product by ID

# Backend Architecture Diagram
<img width="882" height="891" alt="backend-architecture drawio" src="https://github.com/user-attachments/assets/4974b083-cf15-42d0-aefa-34579674829a" />

# Database schema diagram
<img width="1266" height="1096" alt="image" src="https://github.com/user-attachments/assets/fb90c5f1-ec4e-43a9-838a-e99755b8ba79" />



