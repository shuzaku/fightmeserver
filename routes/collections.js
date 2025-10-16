const express = require('express');
const router = express.Router();
const collectionController = require('../controller/collections');

// Collections routes
router.post('/collections', collectionController.addCollection);
router.get('/collectionQuery', collectionController.queryCollection);
router.put('/collections/:id', collectionController.patchCollection);
router.get('/collection/:id', collectionController.getCollection);

module.exports = router;
