const express = require('express');
const router = express.Router();
const playerController = require('../controller/players');

// Players routes
router.post('/player', playerController.addPlayer);
router.get('/playerQuery', playerController.queryPlayer);
router.get('/players', playerController.getPlayers);
router.get('/players/:id', playerController.getPlayer);
router.put('/players/:id', playerController.updatePlayer);
router.delete('/players/:id', playerController.deletePlayer);
router.get('/playerSlug/:slug', playerController.getPlayerBySlug);
router.get('/mergePlayers/:player1Id/:player2Id', playerController.mergePlayers);

module.exports = router;
