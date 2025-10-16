const express = require('express');
const router = express.Router();
const tournamentController = require('../controller/tournaments');

// Tournament routes
router.post('/tournaments', tournamentController.addTournament);
router.get('/tournaments', tournamentController.getTournaments);
router.get('/tournaments/:id', tournamentController.getTournament);
router.get('/completed-tournaments/', tournamentController.getCompletedTournaments);
router.put('/tournaments/:id', tournamentController.updateTournament);
router.delete('/tournaments/:id', tournamentController.deleteTournament);
router.get('/tournamentQuery', tournamentController.queryTournament);

module.exports = router;
