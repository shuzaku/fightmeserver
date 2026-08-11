const express = require('express');
const router = express.Router();
const playerRatingsController = require('../controller/player-ratings');

// Player ratings routes (Glicko-2 leaderboards — see MicroServices/ranking-service)
router.get('/player-ratings', playerRatingsController.getLeaderboard);
router.get('/player-ratings/player/:playerId', playerRatingsController.getPlayerRating);

module.exports = router;
