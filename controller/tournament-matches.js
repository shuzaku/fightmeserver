var TournamentMatches = require("../models/tournament-matches");
var ObjectId = require('mongodb').ObjectId;

// Query Tournament Matches
function queryTournamentMatchesByTournamentId(req, res) {
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



};

module.exports = {queryTournamentMatchesByTournamentId}