var Article = require("../models/articles");
var ObjectId = require('mongodb').ObjectId;

// Add new article
function addArticle(req, res) {
  var Title = req.body.Name;
  var FeaturedImage = req.body.FeaturedImage
  var Content = req.body.Content;

  var new_article = new Article({
    Title: Title,
    FeaturedImage: FeaturedImage,
    Content: Content,
  })

  new_article.save(function (error, article) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!',
      id: article.id
    })
  })
};

// Fetch all articles
function getArticles(req, res) {
  Article.find({}, 'Title FeaturedImage Content', function (error, articles) {
    if (error) { console.error(error); }
    res.send({
      articles: articles
    })
  }).sort({ _id: -1 })
}

// Fetch single article
function getArticle(req, res) {
  Article.findById(req.params.id, 'Title FeaturedImage Content', function (error, article) {
    if (error) { console.error(error); }
    res.send(article)
  })
}

// Update a article
function updateArticle(req, res) {
  var db = req.db;
  Article.findById(req.params.id, 'Title FeaturedImage Content', function (error, article) {
    if (error) { console.error(error); }

    article.Name = req.body.Name;
    article.LogoUrl = req.body.LogoUrl;
    article.YoutubeUrl = req.body.YoutubeUrl;

    article.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a article
function deleteArticle(req, res) {
  Article.remove({
    _id: req.params.id
  }, function (err, article) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

module.exports = { addArticle, getArticles, getArticle, updateArticle, deleteArticle}