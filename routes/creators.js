const express = require('express');
const router = express.Router();
const creatorController = require('../controller/creators');

// Creators routes
router.post('/creator', creatorController.addCreator);
router.get('/creators', creatorController.getCreators);
router.get('/creators/:id', creatorController.getCreator);
router.put('/creators/:id', creatorController.updateCreator);
router.delete('/creators/:id', creatorController.deleteCreator);

module.exports = router;
