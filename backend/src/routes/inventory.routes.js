/*
    Defines inventory API endpoints.
    app.js already makes sure only admins get this far.
    Author: Ma tsz Hin
*/
const router = require("express").Router();
const ctrl = require("../controllers/inventory.controller");

router.post("/batches", ctrl.receive); // POST /api/inventory/batches (receive stock)

module.exports = router;
