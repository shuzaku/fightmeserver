const express = require('express');
const router = express.Router();
const featuredVideoController = require('../controller/featured-videos');

// Featured Videos routes
router.get('/featured-video', featuredVideoController.getFeaturedVideo);
router.post('/featured-video', featuredVideoController.addFeaturedVideo);

module.exports = router;
