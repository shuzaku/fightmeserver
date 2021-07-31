var Match = require("../models/matches");
var ObjectId = require('mongodb').ObjectId;

// Add new matches(s)
function addMatches(req, res) {
    if(!req.query.bulk){
      var Team1Players = req.body.Team1Players;
      var Team2Players = req.body.Team2Players
      var VideoUrl = req.body.VideoUrl;
      var GameId = ObjectId(req.body.GameId);

      var new_match = new Match({
        Team1Players: Team1Players.map(player => {
          return {
            Slot: 1,
            Id: ObjectId(player.Id),
            CharacterIds: player.CharacterIds.map(id => {return ObjectId(id)})
          }
        }),
        Team2Players: Team2Players.map(player => {
          return {
            Slot: 2,
            Id: ObjectId(player.Id),
            CharacterIds: player.CharacterIds.map(id => {return ObjectId(id)})
          }
        }),
        VideoUrl: VideoUrl,
        GameId: GameId,
      });
    
      new_match.save(function (error,match) {
        if (error) {
          console.log(error)
        }
        res.send({
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
          ]
        }
      })

      Match.insertMany(matches, function(error){
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Match saved successfully!'
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
  Match.findById(ObjectId(req.params.id), 'Team1Players Team2Players VideoUrl GameId', function (error, match) {
    if (error) { console.error(error); }

    var Team1Players = req.body.Team1Players;
    var Team2Players = req.body.Team2Players
    var VideoUrl = req.body.VideoUrl;
    var GameId = ObjectId(req.body.GameId);


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
module.exports = { addMatches, getMatches, patchMatch, getMatch }