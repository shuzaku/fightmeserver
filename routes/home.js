const express = require('express');
const router = express.Router();
const homeController = require('../controller/home');

// Home routes
router.get('/counts', homeController.getCounts);

module.exports = router;
