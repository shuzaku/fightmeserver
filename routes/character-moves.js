const express = require('express');
const router = express.Router();
const ctrl = require('../controller/character-moves');

// New canonical routes
router.get('/character-moves/games', ctrl.getGamesWithMoves);   // must come before :characterId
router.get('/character-moves/:characterId', ctrl.getMovesForCharacter);
router.post('/character-moves/bulk', ctrl.bulkUpsertMoves);
router.delete('/character-moves/:id', ctrl.deleteMove);

// Backward-compatible alias — matches the old GET /characterMoves/:id pattern
router.get('/characterMoves/:id', ctrl.getMovesForCharacter);

module.exports = router;
