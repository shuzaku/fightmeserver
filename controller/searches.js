var Player = require("../models/players");
var ObjectId = require('mongodb').ObjectId;

// Fetch all Tag
function getSearchValues(req, res) {
  var queries = [];

  if(req.query && (req.query.queryName || req.query.queryValue)){
    var value = req.query.queryValue
    
    for(var i = 0; i < value.name; i++){
      var query = {};
      query.names[i] = value;
      queries.push(query);
    }
  }
  
  Player.aggregate([
    // {$match: {$or: queries}},
    {
      $unionWith: {
        'coll': 'characters'
      }
    }, {
      $unionWith: {
        'coll': 'games'
      }
    }, {
      $unionWith: {
        'coll': 'creators'
      }
    },
    { 
      $match: {
        _id: {
            $ne: ObjectId("000000000000000000000000")
        }
      }
    },
    {
      $sort: {
        _id: -1
      }
    }
  ], function (error, searchValues) {
    if (error) { console.error(error); }
    res.send({
      searchValues: searchValues
    })
  })
}

module.exports = {getSearchValues}