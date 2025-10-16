const express = require('express');
const router = express.Router();
const featuredVideoController = require('../controller/featured-videos');

// Featured Videos routes
router.get('/featured-video', featuredVideoController.getFeaturedVideo);

module.exports = router;
