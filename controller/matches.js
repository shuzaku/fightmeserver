var Match = require("../models/matches");
var ObjectId = require('mongodb').ObjectId;

// Add new matches(s)
function addMatches(req, res) {
    if(!req.query.bulk){
      var Team1Players = req.body.Team1Players;
      var Team2Players = req.body.Team2Players
      var VideoUrl = req.body.VideoUrl;
      var StartTime = req.body.Team1Players;
      var EndTime = req.body.Team2Players
      var GameId = req.body.VideoUrl;

      var new_match = new Match({
        Team1Players: Team1Players,
        Team2Players: Team2Players,
        VideoUrl: VideoUrl,
        StartTime: StartTime,
        EndTime: EndTime,
        GameId: GameId,
        Tags: Tags
      })
    
      new_match.save(function (error) {
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Match saved successfully!'
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
module.exports = { addMatches, getMatches }