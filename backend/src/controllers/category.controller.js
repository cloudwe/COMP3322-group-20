/*
    Handles category HTTP requests and responses.
    Author: Ma tsz Hin
*/
const repo = require("../repositories/category.repository");

// GET /api/categories
// returns every active category as a JSON array
exports.list = async (req, res, next) => {
  try {
    const categories = await repo.findAll();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};
