const express = require('express');
const router = express.Router();
const tagController = require('../controller/tags');

// Tags routes
router.post('/tags', tagController.addTag);
router.get('/tags', tagController.getTags);

module.exports = router;
