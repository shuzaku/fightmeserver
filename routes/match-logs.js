const express = require('express');
const router = express.Router();
const matchLogController = require('../controller/match-logs');

// Match log routes — personal practice journal entries
router.post('/matchLogs', matchLogController.addMatchLog);
router.get('/matchLogQuery', matchLogController.queryMatchLogs);
router.get('/matchLogs', matchLogController.getMatchLogs);
router.get('/matchLogs/:id', matchLogController.getMatchLog);
router.put('/matchLogs/:id', matchLogController.updateMatchLog);
router.delete('/matchLogs/:id', matchLogController.deleteMatchLog);
router.post('/matchLogMatch', matchLogController.createMatchFromLog);

module.exports = router;
