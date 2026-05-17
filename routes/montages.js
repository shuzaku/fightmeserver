const express = require('express');
const router = express.Router();
const montageController = require('../controller/montages');

// Montages routes
router.post('/montages', montageController.addMontage);
router.get('/montage/:id', montageController.getMontage);
router.get('/montages', montageController.queryMontages);

module.exports = router;
