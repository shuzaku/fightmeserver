const express = require('express');
const router = express.Router();
const analysesController = require('../controller/analyses');

// Analyses routes
router.get('/matchAnalysis/', analysesController.getAnalysisByMatchId);

module.exports = router;
