const express = require('express');
const router = express.Router();
const featuredMatchesController = require('../controller/featured-matches');

// Featured Matches routes
router.get('/featured-matches/', featuredMatchesController.getFeaturedMatches);
router.post('/featured-matches/', featuredMatchesController.addFeaturedMatch);
router.delete('/featured-matches/:matchId', featuredMatchesController.removeFeaturedMatch);
router.get('/featured-matches/:matchId/status', featuredMatchesController.isFeaturedMatch);

module.exports = router;
