var TournamentMatches = require("../models/tournament-matches");
var ObjectId = require('mongodb').ObjectId;

// Query Tournament Matches
function queryTournamentMatchesByTournamentId(req, res) {

  if(req.query.queryName && req.query.queryValue) {

    var tournamentId =  ObjectId(req.params.id);
    this.queryMatches(req, res, tournamentId);
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
          'from': 'tournaments', 
          'localField': 'TournamentId', 
          'foreignField': '_id', 
          'as': 'Tournament'
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

    aggregate.push({$skip: skip});
    aggregate.push({$limit: 5});  

    aggregate.unshift({$match: { TournamentId: tournamentId }});

    TournamentMatches.aggregate(aggregate, function (error, matches) {
      if (error) { console.error(error); }
      res.send({
        matches: matches
      })
    })
  }
};

function queryMatches(req, res, tournamentId =  null) {

  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var queries = [];
  if(tournamentId) {
    queries.push({'TournamentId': ObjectId(tournamentId)})
  }
  
  if (names.length > 0){
      for(var i = 0; i < names.length; i++){
        var query = {};
        if (names[i] === 'GameId') {
          queries.push({'GameId':ObjectId(values[i])});
        }
        else if (names[i] === 'Id') {
          queries.push({'_id':ObjectId(values[i])});
        }
        else if (names[i] === 'CharacterId') {
          var characterQuery= [
            {"Team1PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[i]) } }},
            {"Team2PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[i]) } }},
          ];
          queries.push({$or: characterQuery});
        }
        else {
          var newQuery = {}
          newQuery[names[i]] = {'$eq': values[i]}
          queries.push(newQuery);
        }
      }
  } 
  else {
    for(var i = 0; i < names.length; i++){
      queries[names[i]] = values[i];
    }
  }

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
    },{
      '$lookup': {
        'from': 'tournaments', 
        'localField': 'TournamentId', 
        'foreignField': '_id', 
        'as': 'Tournament'
      }
    },{
      '$unwind': {
        'path': '$Character', 
        'preserveNullAndEmptyArrays': true
      }
    },
  ];
  
  if(queries.length > 0) {
    aggregate.push({$match: {$and: queries}});
  }

  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  

  TournamentMatches.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}

module.exports = {queryTournamentMatchesByTournamentId, queryMatches}