var FeaturedVideos = require("../models/featured-videos");
var ObjectId = require('mongodb').ObjectId;

  function getFeaturedVideo(req, res) {
    FeaturedVideos.find({}, 'VideoUrl CreatorId', function (error, video) {
      if (error) { console.error(error); }
      res.send({
        video: video
      })
    })
  };



module.exports = { getFeaturedVideo}