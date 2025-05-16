var Analyses = require("../models/analyses");
var ObjectId = require('mongodb').ObjectId;

// Fetch all matches
function getAnalysisByMatchId(req, res) {
    var db = req.db;
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    var queries = [];
  
    for(var i = 0; i < names.length; i++){
      var query = {};
      if(names[i] === ('Id')){
        var query = {'_id':   ObjectId(values[i])};
        queries.push(query);
      } else if (names[i] === 'MatchId') {
        var query = {'MatchId':   ObjectId(values[i])};
        queries.push(query);
      }  
      else {
        query[names[i]] = values[i];
        queries.push(query);
      }
    }

    if(queries.length > 1) {
      Analyses.find({ $or: queries }, 'MatchType MatchId Detections', function (error, analyses) {
        if (error) { console.error(error); }
        res.send({
          analyses: analyses
        })
      })
    }
    else {
      Analyses.find(queries[0], 'MatchType MatchId Detections', function (error, analyses) {
        if (error) { console.error(error); }

        res.send({
          analyses: analyses
        })
      })  
    }
}

module.exports = { getAnalysisByMatchId}