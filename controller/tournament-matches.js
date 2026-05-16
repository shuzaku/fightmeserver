var TournamentMatches = require("../models/tournament-matches");
var ObjectId = require('mongodb').ObjectId;
var matchesController = require('../controller/matches');

function toObjectId(val, fieldName) {
  if (val == null || (typeof val === 'string' && !val.trim())) {
    throw new Error('Missing ' + fieldName);
  }
  if (typeof val === 'object' && val.$oid) {
    val = val.$oid;
  }
  var s = typeof val === 'string' ? val.trim() : String(val);
  if (!ObjectId.isValid(s)) {
    throw new Error('Invalid ObjectId for ' + fieldName + ': ' + s);
  }
  return new ObjectId(s);
}

function normalizePlayerPayload(player, defaultSlot, indexLabel) {
  if (!player || !player.Id) {
    throw new Error('Team player missing Id (' + indexLabel + ')');
  }
  var rawIds = player.CharacterIds || [];
  if (!Array.isArray(rawIds)) {
    rawIds = rawIds == null || rawIds === '' ? [] : [rawIds];
  }
  var seen = {};
  var characterIds = [];
  rawIds.forEach(function (cid) {
    if (cid == null || cid === '') return;
    var str = typeof cid === 'object' && cid.$oid ? cid.$oid : String(cid).trim();
    if (!str || seen[str]) return;
    seen[str] = true;
    characterIds.push(toObjectId(str, 'CharacterId'));
  });
  var slot = player.Slot != null ? parseInt(player.Slot, 10) : defaultSlot;
  if (isNaN(slot)) slot = defaultSlot;
  return {
    Id: toObjectId(player.Id, 'Player Id'),
    Slot: slot,
    CharacterIds: characterIds
  };
}

/**
 * POST /tournament-matches/bulk
 * Body: { matches: [ { TournamentId, GameId, VideoUrl, Team1Players, Team2Players, ClipStart, ClipEnd, Notes?, SecondaryNotes?, VideoPlatform? } ] }
 */
function bulkInsertTournamentMatches(req, res) {
  var body = req.body || {};
  var matches = body.matches;
  if (!Array.isArray(matches) || matches.length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty matches array' });
  }

  var docs = [];
  try {
    matches.forEach(function (m, idx) {
      if (!m.Team1Players || !m.Team1Players.length || !m.Team2Players || !m.Team2Players.length) {
        throw new Error('Match at index ' + idx + ' needs Team1Players and Team2Players arrays');
      }
      docs.push({
        TournamentId: toObjectId(m.TournamentId, 'TournamentId'),
        GameId: toObjectId(m.GameId, 'GameId'),
        VideoUrl: m.VideoUrl != null ? String(m.VideoUrl).trim() : '',
        Team1Players: m.Team1Players.map(function (p, i) {
          return normalizePlayerPayload(p, 1, 'Team1[' + i + ']');
        }),
        Team2Players: m.Team2Players.map(function (p, i) {
          return normalizePlayerPayload(p, 2, 'Team2[' + i + ']');
        }),
        ClipStart: m.ClipStart != null ? String(m.ClipStart).trim() : '',
        ClipEnd: m.ClipEnd != null ? String(m.ClipEnd).trim() : '',
        Notes: m.Notes != null && String(m.Notes).trim() !== '' ? String(m.Notes).trim() : undefined,
        SecondaryNotes: m.SecondaryNotes != null && String(m.SecondaryNotes).trim() !== '' ? String(m.SecondaryNotes).trim() : undefined,
        VideoPlatform: m.VideoPlatform != null && String(m.VideoPlatform).trim() !== '' ? String(m.VideoPlatform).trim() : 'Youtube'
      });
    });
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }

  TournamentMatches.insertMany(docs, function (err, inserted) {
    if (err) {
      console.error('bulkInsertTournamentMatches:', err);
      return res.status(500).json({ error: err.message || 'Insert failed' });
    }
    res.json({
      success: true,
      insertedCount: inserted.length,
      ids: inserted.map(function (d) { return d._id; })
    });
  });
}

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

    var parsedPlayerId = null;
    var parsedCharId = null;

    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var val = values[i];
      if (name === 'PlayerId') {
        try { parsedPlayerId = ObjectId(val); }
        catch(e) { console.error('Invalid PlayerId in tournament filter:', val); }
      } else if (name === 'GameId') {
        extra.push({ GameId: ObjectId(val) });
      } else if (name === 'CharacterId') {
        try { parsedCharId = ObjectId(val); }
        catch(e) { console.error('Invalid CharacterId in tournament filter:', val); }
      } else if (name === 'Id') {
        extra.push({ _id: ObjectId(val) });
      } else {
        var obj = {};
        obj[name] = val;
        extra.push(obj);
      }
    }

    // Combine player + character into a single $elemMatch so the character must
    // belong to the specific player, not their opponent
    if (parsedPlayerId) {
      if (parsedCharId) {
        extra.push({
          $or: [
            { Team1Players: { $elemMatch: { Id: parsedPlayerId, CharacterIds: parsedCharId } } },
            { Team2Players: { $elemMatch: { Id: parsedPlayerId, CharacterIds: parsedCharId } } }
          ]
        });
      } else {
        extra.push({
          $or: [
            { Team1Players: { $elemMatch: { Id: parsedPlayerId } } },
            { Team2Players: { $elemMatch: { Id: parsedPlayerId } } }
          ]
        });
      }
    } else if (parsedCharId) {
      // Character filter with no player context — match either side
      extra.push({
        $or: [
          { 'Team1Players': { $elemMatch: { CharacterIds: parsedCharId } } },
          { 'Team2Players': { $elemMatch: { CharacterIds: parsedCharId } } }
        ]
      });
    }

    if (extra.length) {
      // Apply filters at the start of the pipeline for performance and to use raw fields
      aggregate.unshift({ $match: { $and: extra } });
    }
  }

  // Sort by most recent first, then paginate
  aggregate.push({ $sort: { createdAt: -1 } });
  aggregate.push({ $skip: skip });
  aggregate.push({ $limit: 5 });

  TournamentMatches.aggregate(aggregate, function (error, matches) {
    if (error) {
      console.error('Aggregation Error:', error);
      return res.status(500).json({ error: error.message || 'Aggregation error' });
    }
    console.log('Found matches:', matches.length);
    res.json({ matches: matches });
  });
}

/**
 * PUT /tournament-matches/:id
 * Body: { TournamentId, GameId, VideoUrl, Team1Players, Team2Players, ClipStart, ClipEnd, Notes?, SecondaryNotes?, VideoPlatform? }
 * All top-level fields optional; only provided fields are updated. Team arrays must be valid if sent.
 */
function updateTournamentMatch(req, res) {
  var id = req.params.id;
  var oid;
  try {
    oid = toObjectId(id, 'match id');
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }

  var body = req.body || {};
  var setFields = {};
  var unsetFields = {};

  try {
    if (body.TournamentId != null) {
      setFields.TournamentId = toObjectId(body.TournamentId, 'TournamentId');
    }
    if (body.GameId != null) {
      setFields.GameId = toObjectId(body.GameId, 'GameId');
    }
    if (body.VideoUrl !== undefined) {
      setFields.VideoUrl = body.VideoUrl != null ? String(body.VideoUrl).trim() : '';
    }
    if (body.Team1Players != null) {
      if (!Array.isArray(body.Team1Players) || !body.Team1Players.length) {
        throw new Error('Team1Players must be a non-empty array when provided');
      }
      setFields.Team1Players = body.Team1Players.map(function (p, i) {
        return normalizePlayerPayload(p, 1, 'Team1[' + i + ']');
      });
    }
    if (body.Team2Players != null) {
      if (!Array.isArray(body.Team2Players) || !body.Team2Players.length) {
        throw new Error('Team2Players must be a non-empty array when provided');
      }
      setFields.Team2Players = body.Team2Players.map(function (p, i) {
        return normalizePlayerPayload(p, 2, 'Team2[' + i + ']');
      });
    }
    if (body.ClipStart !== undefined) {
      setFields.ClipStart = body.ClipStart != null ? String(body.ClipStart).trim() : '';
    }
    if (body.ClipEnd !== undefined) {
      setFields.ClipEnd = body.ClipEnd != null ? String(body.ClipEnd).trim() : '';
    }
    if (body.Notes !== undefined) {
      if (body.Notes != null && String(body.Notes).trim() !== '') {
        setFields.Notes = String(body.Notes).trim();
      } else {
        unsetFields.Notes = '';
      }
    }
    if (body.SecondaryNotes !== undefined) {
      if (body.SecondaryNotes != null && String(body.SecondaryNotes).trim() !== '') {
        setFields.SecondaryNotes = String(body.SecondaryNotes).trim();
      } else {
        unsetFields.SecondaryNotes = '';
      }
    }
    if (body.VideoPlatform !== undefined) {
      setFields.VideoPlatform =
        body.VideoPlatform != null && String(body.VideoPlatform).trim() !== ''
          ? String(body.VideoPlatform).trim()
          : 'Youtube';
    }
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }

  if (!Object.keys(setFields).length && !Object.keys(unsetFields).length) {
    return res.status(400).json({ error: 'No updatable fields in body' });
  }

  var updateOp = {};
  if (Object.keys(setFields).length) {
    updateOp.$set = setFields;
  }
  if (Object.keys(unsetFields).length) {
    updateOp.$unset = unsetFields;
  }

  TournamentMatches.findByIdAndUpdate(oid, updateOp, { new: true }, function (err, doc) {
    if (err) {
      console.error('updateTournamentMatch', err);
      return res.status(500).json({ error: err.message || 'Update failed' });
    }
    if (!doc) {
      return res.status(404).json({ error: 'Tournament match not found' });
    }
    res.json({ success: true, match: doc });
  });
}

module.exports = {
  queryTournamentMatchesByTournamentId,
  bulkInsertTournamentMatches,
  updateTournamentMatch,
  queryMatches: matchesController.queryMatches
};