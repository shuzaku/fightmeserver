const express = require('express');
console.log("DEBUG: Loading routes/tournament-matches.js");
const router = express.Router();
const tournamentMatchesController = require('../controller/tournament-matches');

// Tournament Matches routes
router.post('/tournament-matches/bulk', tournamentMatchesController.bulkInsertTournamentMatches);
router.put('/tournament-matches/:id', tournamentMatchesController.updateTournamentMatch);
router.get('/tournament-matches/:id', tournamentMatchesController.queryTournamentMatchesByTournamentId);
router.get('/tournament-matches', tournamentMatchesController.queryTournamentMatchesByTournamentId);

module.exports = router;
