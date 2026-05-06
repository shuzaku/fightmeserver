const express = require('express');
const router = express.Router();
const { matchOg, playerOg, characterOg, tournamentOg } = require('../controller/og');

router.get('/og/match/:id',      matchOg);
router.get('/og/player/:id',     playerOg);
router.get('/og/character/:id',  characterOg);
router.get('/og/tournament/:id', tournamentOg);

module.exports = router;
