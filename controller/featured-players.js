var ObjectId = require('mongodb').ObjectId;
var FeaturedPlayer = require("../models/featured-players");

// Fetch all tournament
function getFeaturedPlayers(req, res) {
  var aggregate = [
    {'$lookup': {
        'from': 'players', 
        'localField': 'PlayerId', 
        'foreignField': '_id', 
        'as': 'FeaturedPlayer'
      }
    }
  ]

  FeaturedPlayer.aggregate(aggregate, function (error, featuredPlayers) {
    if (error) { console.error(error); }
    res.send({
      featuredPlayers: featuredPlayers
    })
  })
}

module.exports = 
{
  getFeaturedPlayers
}