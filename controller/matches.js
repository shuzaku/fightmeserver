var Match = require("../models/matches");
var ObjectId = require('mongodb').ObjectId;

// Add new matches(s)
function addMatches(req, res) {
    if(!req.query.bulk){
      var Team1Players = req.body.Team1Players;
      var Team2Players = req.body.Team2Players
      var VideoUrl = req.body.VideoUrl;
      var GameId = ObjectId(req.body.GameId);
      var GameVersion = req.body.GameVersion
      var WinningPlayersId = req.body.WinningPlayersId ? req.body.WinningPlayersId.map(id => {return ObjectId(id)}) : null;
      var LosingPlayersId = req.body.LosingPlayersId ? req.body.LosingPlayersId.map(id => {return ObjectId(id)}) : null;
      var TournamentId = ObjectId(req.body.TournamentId);
      var StartTime = req.body.StartTime;
      var EndTime = req.body.EndTime;
      var new_match = new Match({
        Team1Players: Team1Players.map(player => {
          return {
            Slot: 1,
            Id: ObjectId(player.Id),
            CharacterIds: player.CharacterIds.map(character => { return ObjectId(character.id)})
          }
        }),
        Team2Players: Team2Players.map(player => {
          return {
            Slot: 2,
            Id: ObjectId(player.Id),
            CharacterIds: player.CharacterIds.map(character => {return ObjectId(character.id)})
          }
        }),
        VideoUrl: VideoUrl,
        GameId: GameId,
        GameVersion: GameVersion,
        TournamentId: TournamentId,
        WinningPlayersId: WinningPlayersId,
        LosingPlayersId: LosingPlayersId,
        StartTime: StartTime,
        EndTime: EndTime
      });
    
      new_match.save(function (error,match) {
        if (error) {
          console.log(error)
        }
        res.send({
          match: match,
          success: true,
          message: 'Post saved successfully!'
        })
      })
    }
    else {
      var matches = req.body.map(match =>{
        return {
          VideoUrl: match.VideoUrl,
          GameId: ObjectId(match.GameId),
          GameVersion: GameVersion,
          WinnerIds: match.WinnerIds,
          LoserIds: match.LoserIds,
          Team1Players: [
            {
              Slot:1,
              Id: ObjectId(match.Team1Players[0].Id),
              CharacterIds: match.Team1Players[0].CharacterIds.map(id => { return ObjectId(id)})
            }
          ],
          Team2Players: [
            {
              Slot:2,
              Id: ObjectId(match.Team2Players[0].Id),
              CharacterIds: match.Team2Players[0].CharacterIds.map(id => { return ObjectId(id)})
            }
          ],
          StartTime: match.StartTime,
          EndTime: match.EndTime,
          SubmittedBy: match.SubmittedBy,
          UpdatedBy: match.UpdatedBy,
          TournamentId: ObjectId(match.TournamentId),
        }
      })

      Match.insertMany(matches, function(error){
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Match saved successfully!',
          matches: matches
        })     
      }); 
    }
  };
  
// Fetch all matches
function getMatches(req, res) {
  Match.find({}, 'VideoUrl', function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  }).sort({ _id: -1 })
}

// Update a matches
function patchMatch(req, res) {
  Match.findById(ObjectId(req.params.id), 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, match) {
    if (error) { console.error(error); }

    var Team1Players = req.body.Team1Players;
    var Team2Players = req.body.Team2Players
    var VideoUrl = req.body.VideoUrl;
    var GameId = ObjectId(req.body.GameId);
    var GameVersion = ObjectId(req.body.GameVersion);
    var WinnerIds = req.body.WinnerIds;
    var LoserIds = req.body.LoserIds;

      match.Team1Players = Team1Players.map(player => {
        return {
          Slot: 1,
          Id: ObjectId(player.Id),
          CharacterIds: player.CharacterIds.map(id => {return ObjectId(id)})
        }
      });
      match.Team1Players = Team2Players.map(player => {
        return {
          Slot: 2,
          Id: ObjectId(player.Id),
          CharacterIds: player.CharacterIds.map(id => {return ObjectId(id)})
        }
      });
      VideoUrl = VideoUrl;
      GameId = GameId;
      GameVersion = GameVersion;

    match.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Fetch single match
function getMatch(req, res) {
  var matchId =  ObjectId(req.params.id);

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

  aggregate.unshift({$match: { _id: matchId }});

  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}

// Delete single match
function deleteMatch(req, res) {
  var db = req.db;
  Match.remove({
    _id: req.params.id
  }, function (err, character) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

// Query Matches
function queryMatches(req, res) {
  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var queries = [];
  var aggregate = [];
  
  
  if (names.length > 0){
      for(var i = 0; i < names.length; i++){
        var query = {};
        if (names[i] === 'GameId') {
          query[names[i]] =  {'$eq': ObjectId(values[i])};
        }
        if (names[i] === 'Id') {
          query['_id'] =  {'$eq': ObjectId(values[i])};
        }
        else {
          query[names[i]] =  {'$eq': values[i]}
        }
        queries.push(query);
      }
  } 
  else {
      for(var i = 0; i < names.length; i++){
          var query = {};
          query[names[i]] = values[i];
          queries.push(query);
      }
  }
  
  
  if(queries.length > 0) {
      aggregate.push({$match: {$or: queries}});
  }
  
  if(queries.length > 0) {
      Match.find({ $or: queries }, 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, matches) {
          if (error) { console.error(error); }
          res.send({
            matches: matches
          })
        }).sort({ _id: -1 })    
  }
  else {
    Match.find(queries[0], 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, matches) {
      if (error) { console.error(error); }
      res.send({
        matches: matches
      })
      }).sort({ _id: -1 })    
  }
  }

// Update a matches
function patchMatches(req, res) {
  var queries = req.body.map(match => {
    return  ObjectId(match.id)
  });

  var now = Date.now();

  const update = {$set: {"Updated": now}};
  // const update = {$set: {"_v": 1}};
  const settings = { upsert: true };
  Match.updateMany({}, update, function (error, results) {
    if (error) { console.error(error); }
    if (!error) {
      console.log('success with reject');
      res.sendStatus(200);
    }
  })

}
module.exports = { addMatches, getMatches, patchMatch, getMatch, deleteMatch, queryMatches, patchMatches }