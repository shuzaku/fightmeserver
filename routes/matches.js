const express = require('express');
const router = express.Router();
const matchController = require('../controller/matches');

// Matches routes
router.post('/matches', matchController.addMatches);
router.get('/matches', matchController.getMatches);
router.put('/matches/:id', matchController.patchMatch);
router.get('/match/:id', matchController.getMatch);
router.delete('/match/:id', matchController.deleteMatch);
router.get('/matchQuery', matchController.queryMatches);
router.put('/matches/', matchController.patchMatches);
router.get('/matchesCharacter/', matchController.queryByCharacter);
router.get('/matchesPlayer/', matchController.queryByPlayer);
router.get('/characterMatchup', matchController.getMatchupVideos);
router.get('/characterSlugMatchup', matchController.getSlugMatchupVideos);
router.get('/matchesGame/', matchController.queryByGame);
router.get('/matchesFeed', matchController.queryMatchesFeed);

module.exports = router;
