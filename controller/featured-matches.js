var FeaturedMatch = require("../models/featured-matches");
var ObjectId = require('mongodb').ObjectId;
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");

  function getFeaturedMatches(req, res) {
    var limit = parseLimit(req, 10, 50);
    var skip = parseSkip(req);
    var sortObj = parseSortWithDirection(req, '_id', -1);
    
    FeaturedMatch.find({}, 'VideoUrl', function (error, video) {
      if (error) { console.error(error); }
      res.send({
        video: video
      })
    }).sort(sortObj).skip(skip).limit(limit)
  };



module.exports = { getFeaturedMatches}