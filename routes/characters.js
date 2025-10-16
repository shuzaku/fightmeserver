const express = require('express');
const router = express.Router();
const characterController = require('../controller/characters');

// Characters routes
router.post('/characters', characterController.addCharacter);
router.get('/characterQuery', characterController.queryCharacter);
router.get('/characters', characterController.getCharacters);
router.get('/characters/:id', characterController.getCharacter);
router.get('/characterSlug/:slug', characterController.getCharacterBySlug);
router.put('/characters/:id', characterController.updateCharacter);
router.delete('/characters/:id', characterController.deleteCharacter);
router.get('/characterMatchupInfo', characterController.getMatchupInfo);

module.exports = router;
