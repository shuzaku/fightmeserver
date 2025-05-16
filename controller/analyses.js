var Analyses = require("../models/analyses");
var ObjectId = require('mongodb').ObjectId;

// Fetch all matches
function getAnalysisByMatchId(req, res) {
    var aggregate = [];
    aggregate.push({$match: { "MatchId" : ObjectId(req.params.id) }});

  Analyses.aggregate(aggregate, function (error, data) {
    if (error) { console.error(error); }
    console.log(data)
    res.send({
      data: data
    })
  })
}

module.exports = { getAnalysisByMatchId}