var FeaturedVideos = require("../models/featured-videos");
var ObjectId = require('mongodb').ObjectId;
var { parseLimit, parseSkip, parseSortWithDirection } = require("../utils/query-utils");

  function getFeaturedVideo(req, res) {
    var limit = parseLimit(req, 20, 100);
    var skip = parseSkip(req);
    var sortObj = parseSortWithDirection(req, '_id', -1);

    FeaturedVideos.find({}, 'VideoUrl CreatorId', function (error, video) {
      if (error) { console.error(error); }
      res.send({
        video: video
      })
    }).sort(sortObj).skip(skip).limit(limit)
  };



module.exports = { getFeaturedVideo}