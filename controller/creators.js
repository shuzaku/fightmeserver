var Creator = require("../models/creators");
var ObjectId = require('mongodb').ObjectId;

// Add new creator
function addCreator(req, res) {
  var db = req.db;
  var Name = req.body.Name;
  var LogoUrl = req.body.LogoUrl;
  var YoutubeUrl = req.body.YoutubeUrl;

  var new_creator = new Creator({
    Name: Name,
    LogoUrl: LogoUrl,
    YoutubeUrl: YoutubeUrl
  })

  new_creator.save(function (error) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!'
    })
  })
};

// Fetch all creator
function getCreators(req, res) {
  Creator.aggregate([{$match: {
    _id: {
      $ne: ObjectId("000000000000000000000000")
    }
  }
  }], function (error, creators) {
    if (error) { console.error(error); }
    res.send({
      creators: creators
    })
  })
}

// Fetch single creator
function getCreator(req, res) {
  var db = req.db;
  Creator.findById(req.params.id, 'Name LogoUrl YoutubeUrl', function (error, creator) {
    if (error) { console.error(error); }
    res.send(creator)
  })
}

// Update a creator
function updateCreator(req, res) {
  var db = req.db;
  Creator.findById(req.params.id, 'Name LogoUrl YoutubeUrl', function (error, creator) {
    if (error) { console.error(error); }

    creator.Name = req.body.Name;
    creator.LogoUrl = req.body.LogoUrl;
    creator.YoutubeUrl = req.body.YoutubeUrl;

    creator.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a creator
function deleteCreator(req, res) {
  var db = req.db;
  Creator.remove({
    _id: req.params.id
  }, function (err, creator) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

module.exports = { addCreator, getCreators, getCreator, updateCreator, deleteCreator}