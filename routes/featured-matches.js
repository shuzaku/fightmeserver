const express = require('express');
const router = express.Router();
const featuredMatchesController = require('../controller/featured-matches');

// Featured Matches routes
router.get('/featured-matches/', featuredMatchesController.getFeaturedMatches);

module.exports = router;
