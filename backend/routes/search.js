const express = require('express');
const router = express.Router();
const { searchProducts } = require('../controllers/searchController');

// GET /api/search?q=query
router.get('/', searchProducts);

module.exports = router;
