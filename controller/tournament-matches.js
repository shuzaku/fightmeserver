var TournamentMatches = require("../models/tournament-matches");
var ObjectId = require('mongodb').ObjectId;
var matchesController = require('../controller/matches');

/**
 * GET /tournament-matches/:id?skip=0&queryName=PlayerId&queryValue=...
 * GET /tournament-matches?skip=0&queryName=PlayerId&queryValue=...
 * 
 * Returns tournament matches. 
 * If :id is present, filters by TournamentId.
 * Supports optional query filters (PlayerId, GameId, etc).
 */
function queryTournamentMatchesByTournamentId(req, res) {
  var skip = parseInt(req.query.skip) || 0;

  // Base aggregation with lookups to enrich the match documents
  var aggregate = [
    { $lookup: { from: 'players', localField: 'Team1Players.Id', foreignField: '_id', as: 'Team1Player' } },
    { $lookup: { from: 'players', localField: 'Team2Players.Id', foreignField: '_id', as: 'Team2Player' } },
    { $lookup: { from: 'characters', localField: 'Team1Players.CharacterIds', foreignField: '_id', as: 'Team1PlayerCharacters' } },
    { $lookup: { from: 'characters', localField: 'Team2Players.CharacterIds', foreignField: '_id', as: 'Team2PlayerCharacters' } },
    { $lookup: { from: 'tournaments', localField: 'TournamentId', foreignField: '_id', as: 'Tournament' } },
    { $lookup: { from: 'games', localField: 'GameId', foreignField: '_id', as: 'Game' } }
  ];

  // Filter by the specific tournament ONLY if the ID is provided in the URL parameters
  if (req.params.id) {
    try {
      var tournamentId = ObjectId(req.params.id);
      aggregate.unshift({ $match: { TournamentId: tournamentId } });
    } catch (e) {
      console.error("Invalid Tournament ID:", req.params.id);
      return res.status(400).json({ error: "Invalid Tournament ID" });
    }
  }

  // Optional extra filters (e.g., PlayerId, GameId, Id, or any other field)
  if (req.query.queryName && req.query.queryValue) {
    var names = req.query.queryName.split(',');
    var values = req.query.queryValue.split(',');
    var extra = [];
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var val = values[i];
      if (name === 'PlayerId') {
        var pid = ObjectId(val);
        // Match either side's player Id inside the array of players
        extra.push({
          $or: [
            { Team1Players: { $elemMatch: { Id: pid } } },
            { Team2Players: { $elemMatch: { Id: pid } } }
          ]
        });
      } else if (name === 'GameId') {
        extra.push({ GameId: ObjectId(val) });
      } else if (name === 'Id') {
        extra.push({ _id: ObjectId(val) });
      } else {
        var obj = {};
        obj[name] = val;
        extra.push(obj);
      }
    }
    if (extra.length) {
      // Apply filters at the start of the pipeline for performance and to use raw fields
      aggregate.unshift({ $match: { $and: extra } });
    }
  }

  // Pagination
  aggregate.push({ $skip: skip });
  aggregate.push({ $limit: 5 });


  TournamentMatches.aggregate(aggregate, function (error, matches) {
    if (error) {
      console.error("Aggregation Error:", error);
      return res.status(500).json({ error: error.message || 'Aggregation error' });
    }
    console.log("Found matches:", matches.length);
    res.json({ matches: matches });
  });
}

module.exports = {
  queryTournamentMatchesByTournamentId,
  queryMatches: matchesController.queryMatches
};