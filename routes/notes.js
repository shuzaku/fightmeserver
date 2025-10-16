const express = require('express');
const router = express.Router();
const noteController = require('../controller/notes');

// Notes routes
router.post('/notes', noteController.addNote);
router.get('/noteQuery', noteController.queryNote);
router.get('/notes', noteController.getNotes);
router.get('/notes/:id', noteController.getNote);
router.put('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

module.exports = router;
