const express = require('express');
const router = express.Router();
const articleController = require('../controller/articles');

// Articles routes
router.post('/articles', articleController.addArticle);
router.get('/articles', articleController.getArticles);
router.put('/articles/:id', articleController.updateArticle);
router.delete('/articles/:id', articleController.deleteArticle);

module.exports = router;
