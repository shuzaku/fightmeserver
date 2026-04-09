const express = require('express');
const router = express.Router();
const matchNoteController = require('../controller/match-notes');

// Match Notes routes
router.post('/match-notes', matchNoteController.addMatchNote);
router.get('/match-note-query', matchNoteController.queryMatchNotes);
router.get('/match-notes', matchNoteController.getMatchNotes);
router.get('/match-notes/:id', matchNoteController.getMatchNote);
router.put('/match-notes/:id', matchNoteController.updateMatchNote);
router.post('/match-notes/:id/like', matchNoteController.toggleLikeMatchNote);
router.post('/match-notes/:id/report', matchNoteController.reportMatchNote);
router.delete('/match-notes/:id', matchNoteController.deleteMatchNote);

module.exports = router;

