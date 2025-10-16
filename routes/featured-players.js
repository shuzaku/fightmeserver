const express = require('express');
const router = express.Router();
const featuredPlayerController = require('../controller/featured-players');

// Featured Players routes
router.get('/featuredPlayers', featuredPlayerController.getFeaturedPlayers);

module.exports = router;
