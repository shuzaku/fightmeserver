var MatchLog = require("../models/match-logs");
var Match = require("../models/matches");
var ObjectId = require('mongodb').ObjectId;

const SELECT_FIELDS = 'Game Date UserCharacter OpponentCharacter Wins Losses Result VideoUrl Notes AuthorId GameId MatchId UserCharacterIds OpponentCharacterIds createdAt updatedAt';

function safeObjectId(value) {
  if (!value || value === 'null' || value === 'undefined' || value === '') {
    return null;
  }
  try {
    if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      return ObjectId(value);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Auto-derive Won/Loss from wins/losses if the caller didn't pin it.
function resolveResult(body) {
  if (body.Result && ['Won', 'Loss', 'Draw'].includes(body.Result)) {
    return body.Result;
  }
  var wins = Number(body.Wins) || 0;
  var losses = Number(body.Losses) || 0;
  if (wins > losses) return 'Won';
  if (losses > wins) return 'Loss';
  return 'Draw';
}

function toObjectIdArray(value) {
  if (!value) return [];
  var arr = Array.isArray(value) ? value : [value];
  return arr.map(safeObjectId).filter(Boolean);
}

function buildLogPayload(body) {
  return {
    Game: body.Game,
    Date: body.Date ? new Date(body.Date) : new Date(),
    UserCharacter: body.UserCharacter,
    OpponentCharacter: body.OpponentCharacter,
    Wins: Number(body.Wins) || 0,
    Losses: Number(body.Losses) || 0,
    Result: resolveResult(body),
    VideoUrl: body.VideoUrl || '',
    Notes: body.Notes || '',
    AuthorId: safeObjectId(body.AuthorId),
    GameId: safeObjectId(body.GameId),
    MatchId: safeObjectId(body.MatchId),
    UserCharacterIds: toObjectIdArray(body.UserCharacterIds),
    OpponentCharacterIds: toObjectIdArray(body.OpponentCharacterIds),
  };
}

// Add new match log
function addMatchLog(req, res) {
  var payload = buildLogPayload(req.body);
  if (!payload.AuthorId) {
    return res.status(400).send({ success: false, message: 'AuthorId is required' });
  }

  var newLog = new MatchLog(payload);
  newLog.save(function (error, log) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, message: 'Error saving match log', error: error.message });
    }
    res.send({
      success: true,
      message: 'Match log saved successfully!',
      matchLogId: log._id,
      matchLog: log,
    });
  });
}

// Query match logs (mirrors notes/games query pattern)
function queryMatchLogs(req, res) {
  if (!req.query.queryName || !req.query.queryValue) {
    return res.status(400).send({ success: false, message: 'queryName and queryValue are required' });
  }

  var names = req.query.queryName.split(',');
  var values = req.query.queryValue.split(',');
  var queries = [];

  for (var i = 0; i < names.length; i++) {
    var query = {};
    var name = names[i];
    var value = values[i];

    if (name === 'AuthorId') {
      var oid = safeObjectId(value);
      if (!oid) continue;
      query[name] = { $eq: oid };
    } else if (name === 'Id') {
      var idOid = safeObjectId(value);
      if (!idOid) continue;
      query._id = { $eq: idOid };
    } else {
      query[name] = { $eq: value };
    }
    queries.push(query);
  }

  var filter = queries.length > 0 ? { $and: queries } : {};

  MatchLog.find(filter, SELECT_FIELDS, function (error, logs) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, message: 'Error querying match logs', error: error.message });
    }
    res.send({ matchLogs: logs });
  }).sort({ Date: -1, _id: -1 });
}

// Fetch all match logs (admin-style; consider scoping by author in the UI)
function getMatchLogs(req, res) {
  MatchLog.find({}, SELECT_FIELDS, function (error, logs) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, message: 'Error fetching match logs', error: error.message });
    }
    res.send({ matchLogs: logs });
  }).sort({ Date: -1, _id: -1 });
}

// Fetch a single match log
function getMatchLog(req, res) {
  MatchLog.findById(req.params.id, SELECT_FIELDS, function (error, log) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, message: 'Error fetching match log', error: error.message });
    }
    res.send(log);
  });
}

// Update a match log
function updateMatchLog(req, res) {
  MatchLog.findById(req.params.id, function (error, log) {
    if (error || !log) {
      console.error(error);
      return res.status(404).send({ success: false, message: 'Match log not found' });
    }

    var payload = buildLogPayload(req.body);
    log.Game = payload.Game;
    log.Date = payload.Date;
    log.UserCharacter = payload.UserCharacter;
    log.OpponentCharacter = payload.OpponentCharacter;
    log.Wins = payload.Wins;
    log.Losses = payload.Losses;
    log.Result = payload.Result;
    log.VideoUrl = payload.VideoUrl;
    log.Notes = payload.Notes;
    if (payload.AuthorId) {
      log.AuthorId = payload.AuthorId;
    }
    if (payload.GameId) log.GameId = payload.GameId;
    if (payload.MatchId) log.MatchId = payload.MatchId;
    log.UserCharacterIds = payload.UserCharacterIds;
    log.OpponentCharacterIds = payload.OpponentCharacterIds;

    log.save(function (saveError, saved) {
      if (saveError) {
        console.error(saveError);
        return res.status(500).send({ success: false, message: 'Error updating match log', error: saveError.message });
      }
      res.send({ success: true, matchLog: saved });
    });
  });
}

// Delete a match log
function deleteMatchLog(req, res) {
  MatchLog.remove({ _id: req.params.id }, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send({ success: false, message: 'Error deleting match log', error: err.message });
    }
    res.send({ success: true });
  });
}

// Create a Match record from a match log video submission.
// Uses the existing Matches model but via a clean endpoint that doesn't
// require tournament data or the legacy controller's ObjectId quirks.
function createMatchFromLog(req, res) {
  var body = req.body;

  var player1Id = safeObjectId(body.Player1Id);
  var player2Id = safeObjectId(body.Player2Id);

  if (!player1Id || !player2Id) {
    return res.status(400).send({ success: false, message: 'Player1Id and Player2Id are required' });
  }

  var gameId = safeObjectId(body.GameId);
  var userCharIds = toObjectIdArray(body.UserCharacterIds);
  var oppCharIds = toObjectIdArray(body.OpponentCharacterIds);
  var submittedBy = safeObjectId(body.SubmittedBy);

  // Derive winning / losing player lists from the log result when provided
  var result = body.Result || '';
  var winningPlayersId = [];
  var losingPlayersId = [];
  if (result === 'Won') {
    winningPlayersId = [player1Id];
    losingPlayersId = [player2Id];
  } else if (result === 'Loss') {
    winningPlayersId = [player2Id];
    losingPlayersId = [player1Id];
  }

  var newMatch = new Match({
    Team1Players: [{
      Slot: 1,
      Id: player1Id,
      CharacterIds: userCharIds,
    }],
    Team2Players: [{
      Slot: 2,
      Id: player2Id,
      CharacterIds: oppCharIds,
    }],
    VideoUrl: body.VideoUrl || '',
    GameId: gameId,
    SubmittedBy: submittedBy,
    WinningPlayersId: winningPlayersId,
    LosingPlayersId: losingPlayersId,
    Origin: 'user-submitted',
  });

  newMatch.save(function (error, match) {
    if (error) {
      console.error(error);
      return res.status(500).send({ success: false, message: 'Error saving match', error: error.message });
    }
    res.send({ success: true, matchId: match._id, match: match });
  });
}

module.exports = {
  addMatchLog,
  queryMatchLogs,
  getMatchLogs,
  getMatchLog,
  updateMatchLog,
  deleteMatchLog,
  createMatchFromLog,
};
