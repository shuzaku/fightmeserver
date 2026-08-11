const express = require('express');
const router = express.Router();
const playerTournamentHistoryController = require('../controller/player-tournament-history');

// Raw bracket-data tournament/match history for a player's page "History" tab
// (see MicroServices/tournament-ingestion-service) — distinct from the curated
// video-clip feed served by /matches and /tournament-matches.
router.get('/players/:playerId/tournament-history', playerTournamentHistoryController.getPlayerTournamentHistory);

module.exports = router;
