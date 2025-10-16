const express = require('express');
const router = express.Router();
const tournamentMatchesController = require('../controller/tournament-matches');

// Tournament Matches routes
router.get('/tournament-matches/:id', tournamentMatchesController.queryTournamentMatchesByTournamentId);
router.get('/tournament-matches', tournamentMatchesController.queryMatches);

module.exports = router;
