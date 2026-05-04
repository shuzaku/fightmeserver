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
      } else if (names[i] === 'videoUrl') {
        // Match against the full stored URL (contains) or the bare youtube_id field
        var query = { $or: [
          { videoUrl: { $regex: values[i], $options: 'i' } },
          { 'video_info.youtube_id': values[i] }
        ]};
        queries.push(query);
      } else {
        query[names[i]] = values[i];
        queries.push(query);
      }
    }

    const projection = 'MatchType MatchId match_lookup_found analyzed_at videoUrl video_path detector detector_detail summary video_info player_stats frame_detections Detections';

    if(queries.length > 1) {
      Analyses.find({ $or: queries }, projection, function (error, analyses) {
        if (error) { console.error(error); }
        res.send({
          analyses: analyses
        })
      })
    }
    else {
      Analyses.find(queries[0], projection, function (error, analyses) {
        if (error) { console.error(error); }

        res.send({
          analyses: analyses
        })
      })  
    }
}

module.exports = { getAnalysisByMatchId}