var FeaturedMatch = require("../models/featured-matches");
var ObjectId = require('mongodb').ObjectId;
var { parseLimit, parseSkip, parseSortWithDirection } = require("../utils/query-utils");

function getFeaturedMatches(req, res) {
  var limit = parseLimit(req, 10, 50);
  var skip = parseSkip(req);
  var sortObj = parseSortWithDirection(req, '_id', -1);

  FeaturedMatch.find({}, 'VideoUrl MatchId GameIds CreatorId', function (error, video) {
    if (error) { console.error(error); }
    res.send({ video });
  }).sort(sortObj).skip(skip).limit(limit);
}

// Add a match to featured
function addFeaturedMatch(req, res) {
  var videoUrl  = req.body.VideoUrl;
  var gameIds   = req.body.GameIds  || [];
  var creatorId = req.body.CreatorId || null;

  if (!videoUrl) {
    return res.status(400).send({ error: 'VideoUrl is required' });
  }

  var creatorObjId = null;
  if (creatorId) {
    try { creatorObjId = ObjectId(creatorId); } catch (e) {}
  }

  var gameObjIds = [];
  gameIds.forEach(function (gid) {
    try { gameObjIds.push(ObjectId(gid)); } catch (e) {}
  });

  var newFeaturedMatch = new FeaturedMatch({
    VideoUrl:  videoUrl,
    GameIds:   gameObjIds,
    CreatorId: creatorObjId,
  });

  newFeaturedMatch.save(function (error, doc) {
    if (error) { console.error(error); return res.status(500).send({ error }); }
    res.send({ success: true, featuredMatch: doc });
  });
}

// Remove a match from featured
function removeFeaturedMatch(req, res) {
  var matchId = req.params.matchId;
  var id;
  try { id = ObjectId(matchId); } catch (e) {
    return res.status(400).send({ error: 'Invalid matchId' });
  }

  FeaturedMatch.findOneAndDelete({ MatchId: id }, function (error) {
    if (error) { console.error(error); return res.status(500).send({ error }); }
    res.send({ success: true });
  });
}

// Check if a specific match is featured
function isFeaturedMatch(req, res) {
  var matchId = req.params.matchId;
  var id;
  try { id = ObjectId(matchId); } catch (e) {
    return res.status(400).send({ error: 'Invalid matchId' });
  }

  FeaturedMatch.exists({ MatchId: id }, function (error, exists) {
    if (error) { console.error(error); return res.status(500).send({ error }); }
    res.send({ isFeatured: !!exists });
  });
}

module.exports = { getFeaturedMatches, addFeaturedMatch, removeFeaturedMatch, isFeaturedMatch }