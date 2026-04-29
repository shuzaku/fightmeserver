var FeaturedVideos = require("../models/featured-videos");
var featuredVideosService = require("../service/featured-videos-service");
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var { parseLimit, parseSkip, parseSortWithDirection } = require("../utils/query-utils");

  function getFeaturedVideo(req, res) {
    var limit = parseLimit(req, 20, 100);
    var skip = parseSkip(req);
    var sortObj = parseSortWithDirection(req, '_id', -1);

    // Build query filter based on query parameters
    var query = {};
    
    if (req.query.GameId) {
      try {
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(req.query.GameId)) {
          return res.status(400).send({ error: 'Invalid GameId format' });
        }
        var gameIdObj = new ObjectId(req.query.GameId);
        // Check if GameIds array contains the GameId
        // MongoDB automatically matches if the value is in the array
        query.GameIds = gameIdObj;
      } catch (error) {
        return res.status(400).send({ error: 'Invalid GameId format' });
      }
    }
    
    if (req.query.Type) {
      query.Type = req.query.Type;
    }

    var queryBuilder = FeaturedVideos.find(query, 'VideoUrl CreatorId GameIds Type');
    
    if (sortObj) {
      queryBuilder = queryBuilder.sort(sortObj);
    }
    
    if (skip) {
      queryBuilder = queryBuilder.skip(skip);
    }
    
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    queryBuilder.exec(function (error, video) {
      if (error) { 
        return res.status(500).send({ error: 'Error fetching featured videos' });
      }
      res.send({
        video: video || []
      });
    });
  };

  function addFeaturedVideo(req, res) {
    featuredVideosService.addFeaturedVideo(req.body)
      .then(result => {
        res.send(result);
      })
      .catch(error => {
        console.error('Error adding featured video:', error);
        res.status(500).send({
          success: false,
          message: 'Error saving featured video',
          error: error.message
        });
      });
  }

module.exports = { getFeaturedVideo, addFeaturedVideo }