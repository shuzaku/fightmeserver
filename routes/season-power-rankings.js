const express = require('express');
const router = express.Router();
const seasonPowerRankingsController = require('../controller/season-power-rankings');

// Season power ranking routes (PGR/LumiRank-style yearly rankings — see
// MicroServices/ranking-service's `npm run season`). Separate from
// /player-ratings (the live Glicko-2 leaderboard) — these are two
// independent systems.
router.get('/season-power-rankings/seasons', seasonPowerRankingsController.getAvailableSeasons);
router.get('/season-power-rankings/player/:playerId', seasonPowerRankingsController.getPlayerSeasonRanking);
router.get('/season-power-rankings', seasonPowerRankingsController.getSeasonLeaderboard);

module.exports = router;
