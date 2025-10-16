const express = require('express');
const router = express.Router();
const characterMatchupController = require('../controller/character-matchups');

// Character Matchups routes
router.get('/characterMatchupStat/', characterMatchupController.queryCharacterMatchup);

module.exports = router;
