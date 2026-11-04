/*
    Defines category API endpoints.
    Author: Ma tsz Hin
*/
const router = require("express").Router();
const ctrl = require("../controllers/category.controller");

router.get("/", ctrl.list); // GET /api/categories (returns all active categories)

module.exports = router;
