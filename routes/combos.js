const express = require('express');
const router = express.Router();
const comboController = require('../controller/combos');

// Combos routes
router.post('/combos', comboController.addCombo);
router.put('/combo/:id', comboController.patchCombo);
router.delete('/combo/:id', comboController.deleteCombo);

module.exports = router;
