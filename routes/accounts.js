const express = require('express');
const router = express.Router();
const accountController = require('../controller/accounts');

// Accounts routes
router.post('/accounts', accountController.addAccount);
router.get('/accounts/:id', accountController.getAccount);
router.put('/accounts/:id', accountController.patchAccount);

module.exports = router;
