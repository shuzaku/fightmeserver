const express = require('express');
const router = express.Router();
const searchController = require('../controller/searches');

// Search routes
router.get('/initialSearch', searchController.defaultSearch);
router.get('/search', searchController.getSearchValues);

module.exports = router;
