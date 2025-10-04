var FeaturedMatches = require("../models/featured-matches");
var ObjectId = require('mongodb').ObjectId;

// Fetch single match
function getFeaturedMatches(req, res) {
  var matchId =  ObjectId(req.params.id);
  
  var aggregate = [
    {
      '$sort': 
        {'_id': -1}
    },
    {
      '$limit': 6
    }
  ]

  aggregate.unshift({$match: { _id: matchId }});

  FeaturedMatches.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}


module.exports = { 
  getFeaturedMatches, 

}