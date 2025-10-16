const express = require('express');
const router = express.Router();
const gameController = require('../controller/games');

// Games routes
router.post('/games', gameController.addGame);
router.get('/gameQuery', gameController.queryGame);
router.get('/games', gameController.getGames);
router.get('/games/:id', gameController.getGame);
router.put('/games/:id', gameController.updateGame);
router.delete('/games/:id', gameController.deleteGame);

module.exports = router;
