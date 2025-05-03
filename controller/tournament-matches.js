var TournamentMatches = require("../models/tournament-matches");
var ObjectId = require('mongodb').ObjectId;

// Query Tournament Matches
function queryTournamentMatchesByTournamentId(req, res) {

  if(req.query.queryName && req.query.queryValue) {
    this.queryMatches(req, res);
  } 
  else {
    var tournamentId =  ObjectId(req.params.id);

    var aggregate = [
      {
        '$lookup': {
          'from': 'players', 
          'localField': 'Team1Players.Id', 
          'foreignField': '_id', 
          'as': 'Team1Player'
        }
      }, {
        '$lookup': {
          'from': 'players', 
          'localField': 'Team2Players.Id', 
          'foreignField': '_id', 
          'as': 'Team2Player'
        }
      }, {
        '$lookup': {
          'from': 'characters', 
          'localField': 'Team1Players.CharacterIds', 
          'foreignField': '_id', 
          'as': 'Team1PlayerCharacters'
        }
      }, {
        '$lookup': {
          'from': 'characters', 
          'localField': 'Team2Players.CharacterIds', 
          'foreignField': '_id', 
          'as': 'Team2PlayerCharacters'
        }
      }, {
        '$lookup': {
          'from': 'games', 
          'localField': 'GameId', 
          'foreignField': '_id', 
          'as': 'Game'
        }
      },
    ]

    aggregate.unshift({$match: { TournamentId: tournamentId }});

    TournamentMatches.aggregate(aggregate, function (error, matches) {
      if (error) { console.error(error); }
      res.send({
        matches: matches
      })
    })
  }
};

function queryMatches(req, res) {
  var tournamentId =  ObjectId(req.params.id);

  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var queries = { TournamentId:  ObjectId(tournamentId) };  
  
  if (names.length > 0){
      for(var i = 0; i < names.length; i++){
        var query = {};
        if (names[i] === 'GameId') {
          queries[names[i]] =   ObjectId(values[i])
        }
        if (names[i] === 'Id') {
          queries['_id'] =  ObjectId(values[i]);
        }
        else {
          queries[names[i]] =  values[i]
        }
      }
  } 
  else {
      for(var i = 0; i < names.length; i++){
          queries[names[i]] = values[i];
      }
  }
  
  console.log(queries);
  TournamentMatches.find(queries, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
};

module.exports = {queryTournamentMatchesByTournamentId, queryMatches}