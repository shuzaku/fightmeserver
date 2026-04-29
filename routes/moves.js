const express = require('express');
const router = express.Router();
const moveController = require('../controller/moves');

// Moves routes
router.get('/characterMoves/:id', moveController.getCharacterMoves);

module.exports = router;
