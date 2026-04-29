const express = require('express');
const router = express.Router();
const updateController = require('../controller/updates');

// Updates routes
router.post('/updates', updateController.addUpdate);
router.get('/updates', updateController.getUpdates);
router.get('/recentUpdates', updateController.queryRecentUpdates);
router.delete('/updates/:id', updateController.deleteUpdate);

module.exports = router;
