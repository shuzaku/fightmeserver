var Match = require("../models/matches");
var Character = require("../models/characters");
var creatorResolve = require("../service/creator-resolve-service");
var ObjectId = require('mongodb').ObjectId;

function safeObjectId(value) {
  try { return new ObjectId(String(value)); } catch (e) { return null; }
}

// Shared filter that strips user-submitted matches from all public feeds.
// Documents where Origin is absent (legacy) are NOT excluded — only the
// explicit 'user-submitted' value is filtered out.
const EXCLUDE_USER_SUBMITTED = { Origin: { $ne: 'user-submitted' } };

// Resolve a character param that may be a Mongo ObjectId string OR a slug.
// Returns a Mongo ObjectId or null.
async function resolveCharacterId(value) {
  if (!value) return null;
  const id = safeObjectId(value);
  if (id) return id;
  // Not an ObjectId — try slug lookup (case-insensitive)
  const found = await Character.findOne({ Slug: new RegExp('^' + value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
  return found ? found._id : null;
}


// Add new matches(s)
async function addMatches(req, res) {
    if(!req.query.bulk){
      var Team1Players = req.body.Team1Players;
      var Team2Players = req.body.Team2Players
      var VideoUrl = req.body.VideoUrl;
      var GameId = ObjectId(req.body.GameId);
      var GameVersion = req.body.GameVersion
      var WinningPlayersId = req.body.WinningPlayersId ? req.body.WinningPlayersId : null;
      var LosingPlayersId = req.body.LosingPlayersId ? req.body.LosingPlayersId : null;
      var TournamentId = ObjectId(req.body.TournamentId);
      var TournamentMatchType = ObjectId(req.body.TournamentMatchType)
      var StartTime = req.body.StartTime;
      var EndTime = req.body.EndTime;

      if (!req.body.ContentCreatorId) {
        try {
          await creatorResolve.findOrCreateFromVideo({
            videoType: req.body.VideoType || 'youtube',
            url: VideoUrl,
            importVideoUrl: req.body.ImportVideoUrl,
          });
        } catch (creatorErr) {
          console.error('creator resolve on addMatches:', creatorErr.message);
        }
      }

      var new_match = new Match({
        Team1Players: Team1Players.map(player => {
          return {
            Slot: player.Slot,
            Id: ObjectId(player.Id),
            CharacterIds: player.CharacterIds.map(character => { return ObjectId(character.id)})
          }
        }),
        Team2Players: Team2Players.map(player => {
          return {
            Slot: player.Slot,
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
        EndTime: EndTime,
        TournamentMatchType:TournamentMatchType
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
          TournamentMatchType: match.TournamentMatchType
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

// Update a match
function patchMatch(req, res) {
  console.log('=== PATCH MATCH REQUEST ===');
  console.log('Match ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
  Match.findById(ObjectId(req.params.id), 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, match) {
    if (error) { console.error(error); return res.status(500).send({ error }); }
    if (!match) { return res.status(404).send({ error: 'Match not found' }); }

    var Team1Players = req.body.Team1Players;
    var Team2Players = req.body.Team2Players;
    var VideoUrl = req.body.VideoUrl;
    var GameId = ObjectId(req.body.GameId);

    console.log('Team1Players from request:', JSON.stringify(Team1Players, null, 2));
    console.log('Team2Players from request:', JSON.stringify(Team2Players, null, 2));

    // Map the new players
    const newTeam1Players = Team1Players.map(player => {
      return {
        Slot: player.Slot,
        Id: ObjectId(player.Id),
        CharacterIds: player.CharacterIds.map(id => { return ObjectId(id) })
      }
    });
    const newTeam2Players = Team2Players.map(player => {
      return {
        Slot: player.Slot,
        Id: ObjectId(player.Id),
        CharacterIds: player.CharacterIds.map(id => { return ObjectId(id) })
      }
    });

    // Clear existing arrays and set new values
    match.Team1Players = [];
    match.Team2Players = [];
    match.Team1Players = newTeam1Players;
    match.Team2Players = newTeam2Players;
    
    // Explicitly mark arrays as modified (important for Mongoose)
    match.markModified('Team1Players');
    match.markModified('Team2Players');
    
    match.VideoUrl = VideoUrl;
    match.GameId = GameId;

    console.log('Mapped Team1Players:', JSON.stringify(match.Team1Players, null, 2));
    console.log('Mapped Team2Players:', JSON.stringify(match.Team2Players, null, 2));

    match.save(function (error) {
      if (error) {
        console.log('Save error:', error);
        return res.status(500).send({ error });
      }
      console.log('Match saved successfully');
      res.send({ success: true });
    });
  });
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

// Query by character
function queryByCharacter(req, res) {
  var queries = [];
  var skip =  parseInt(req.query.skip);
  var aggregate = [
    { $match: EXCLUDE_USER_SUBMITTED },
    {
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
    },{
      '$unwind': {
        'path': '$Character', 
        'preserveNullAndEmptyArrays': true
      }
    }
  ];

  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    //parse query for player id
    for(var i = 0; i < names.length; i++){
      switch (names[i]){
        case 'CharacterId':
          var characterQuery= [
            {"Team1PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[i]) } }},
            {"Team2PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[i]) } }},
          ];
          queries.push({$or: characterQuery});
          break

          case 'CharacterSlug':
            var characterQuery= [
              {"Team1PlayerCharacters": { '$elemMatch': { 'Slug': values[i] } }},
              {"Team2PlayerCharacters": { '$elemMatch': { 'Slug': values[i] } }},
            ];
            queries.push({$or: characterQuery});
            break
      }
    }
  };

  if(queries.length > 0) {
    aggregate.push({$match: {$and: queries}});
  }

  aggregate.push({$sort: { _id: -1 }});  
  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  

  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}

// Query by player
function queryByPlayer(req, res) {
  var queries = [];
  var skip =  parseInt(req.query.skip);
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
    '$unwind': {
      'path': '$Player', 
      'preserveNullAndEmptyArrays': true
    }
  } ];

  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");

    var parsedPlayerId = null;
    var parsedPlayerSlug = null;
    var parsedCharId = null;

    for(var i = 0; i < names.length; i++){
      switch (names[i]){
        case 'PlayerId':
          try { parsedPlayerId = ObjectId(values[i]); }
          catch(e) { console.error('Invalid PlayerId:', values[i]); }
          break;

        case 'PlayerSlug':
          parsedPlayerSlug = values[i];
          break;

        case 'GameId':
          try { queries.push({ 'GameId': ObjectId(values[i]) }); }
          catch(e) { console.error('Invalid GameId:', values[i]); }
          break;

        case 'CharacterId':
          try { parsedCharId = ObjectId(values[i]); }
          catch(e) { console.error('Invalid CharacterId:', values[i]); }
          break;
      }
    }

    // Build the player filter, combining with character if present so we only
    // match matches where the specific player was playing the selected character
    if (parsedPlayerId) {
      if (parsedCharId) {
        queries.push({ $or: [
          { "Team1Players": { $elemMatch: { Id: parsedPlayerId, CharacterIds: parsedCharId } } },
          { "Team2Players": { $elemMatch: { Id: parsedPlayerId, CharacterIds: parsedCharId } } }
        ]});
      } else {
        queries.push({ $or: [
          { "Team1Players": { $elemMatch: { Id: parsedPlayerId } } },
          { "Team2Players": { $elemMatch: { Id: parsedPlayerId } } }
        ]});
      }
    } else if (parsedPlayerSlug) {
      if (parsedCharId) {
        // Correlate slug (from lookup) with CharacterIds (from raw embedded doc)
        var _charId = parsedCharId;
        var _slug = parsedPlayerSlug;
        queries.push({
          $expr: {
            $or: [
              {
                $gt: [{
                  $size: {
                    $filter: {
                      input: "$Team1Players", as: "tp",
                      cond: {
                        $and: [
                          { $in: [_charId, { $ifNull: ["$$tp.CharacterIds", []] }] },
                          { $gt: [{ $size: { $filter: {
                            input: "$Team1Player", as: "p",
                            cond: { $and: [{ $eq: ["$$p._id", "$$tp.Id"] }, { $eq: ["$$p.Slug", _slug] }] }
                          }}}, 0] }
                        ]
                      }
                    }
                  }
                }, 0]
              },
              {
                $gt: [{
                  $size: {
                    $filter: {
                      input: "$Team2Players", as: "tp",
                      cond: {
                        $and: [
                          { $in: [_charId, { $ifNull: ["$$tp.CharacterIds", []] }] },
                          { $gt: [{ $size: { $filter: {
                            input: "$Team2Player", as: "p",
                            cond: { $and: [{ $eq: ["$$p._id", "$$tp.Id"] }, { $eq: ["$$p.Slug", _slug] }] }
                          }}}, 0] }
                        ]
                      }
                    }
                  }
                }, 0]
              }
            ]
          }
        });
      } else {
        queries.push({ $or: [
          { "Team1Player": { $elemMatch: { Slug: parsedPlayerSlug } } },
          { "Team2Player": { $elemMatch: { Slug: parsedPlayerSlug } } }
        ]});
      }
    } else if (parsedCharId) {
      // Character filter with no player context — match either side
      queries.push({ $or: [
        { "Team1PlayerCharacters": { $elemMatch: { '_id': parsedCharId } } },
        { "Team2PlayerCharacters": { $elemMatch: { '_id': parsedCharId } } }
      ]});
    }
  };

  if(queries.length > 0) {
    aggregate.push({$match: {$and: queries}});
  }

  aggregate.push({$sort: {'_id': -1}})
  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  
  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}

// Query by Game
function queryByGame(req, res) {
  var queries = [];
  var skip =  parseInt(req.query.skip);
  var aggregate = [
  { $match: EXCLUDE_USER_SUBMITTED },
  {
    '$lookup': {
      'from': 'games', 
      'localField': 'GameId', 
      'foreignField': '_id', 
      'as': 'Game'
    },

  }
  ];

  aggregate.push({$match: {'GameId': ObjectId(req.query.queryValue)}});

  aggregate.push({$sort: {'_id': -1}})
  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  
  
  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}

// Query Videos
async function getMatchupVideos(req, res) {
  var queries = [];

  var skip = parseInt(req.query.skip) || 0;

  const character1 = await resolveCharacterId(req.query.character1);
  const character2 = await resolveCharacterId(req.query.character2);

  if (!character1 || !character2) {
    return res.status(400).send({ error: 'Invalid or unresolvable character identifiers' });
  }

  var aggregate = [
    { $match: EXCLUDE_USER_SUBMITTED },
    {
      '$sort': {'_id': -1}
    },{
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
    }
  ];
  queries.push({
      $and: [
        {"Team1PlayerCharacters": { '$elemMatch': { '_id':  character1 } }},
        {"Team2PlayerCharacters": { '$elemMatch': { '_id':  character2 } }}
      ]
  })

  queries.push({
      $and: [
        {"Team1PlayerCharacters": { '$elemMatch': { '_id':  character2 } }},
        {"Team2PlayerCharacters": { '$elemMatch': { '_id':  character1 } }}
      ]
  })

  aggregate.push({$match: {$or: queries}});

  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  
  
  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); return res.status(500).send({ error: 'Query failed' }); }
    res.send({
      matches: matches
    })
  })
}

// Query Videos by player
function getSlugMatchupVideos(req, res) {
  var queries = [];

  var skip =  parseInt(req.query.skip);
  var aggregate = [
    { $match: EXCLUDE_USER_SUBMITTED },
    {
      '$sort': 
        {'_id': -1}
      
    },{
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
    }
  ];
  var character1 = req.query.character1;
  var character2 = req.query.character2;
  queries.push({
      $and: [
        {"Team1PlayerCharacters": { '$elemMatch': { 'Slug': { $regex: new RegExp('^' + character1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }}},
        {"Team2PlayerCharacters": { '$elemMatch': { 'Slug': { $regex: new RegExp('^' + character2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }}}
      ]
  })

  queries.push({
      $and: [
        {"Team1PlayerCharacters": { '$elemMatch': { 'Slug': { $regex: new RegExp('^' + character2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }}},
        {"Team2PlayerCharacters": { '$elemMatch': { 'Slug': { $regex: new RegExp('^' + character1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } }}}
      ]
  })

  aggregate.push({$match: {$or: queries}});

  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  
  
  Match.aggregate(aggregate, function (error, matches) {
    if (error) { console.error(error); }
    res.send({
      matches: matches
    })
  })
}
// Lean feed query — returns only _id array, no joins.
// Used by the /matches browse page. Cards self-fetch their own display data.
function queryMatchesFeed(req, res) {
  var skip  = parseInt(req.query.skip)  || 0;
  var limit = parseInt(req.query.limit) || 5;
  if (limit > 20) limit = 20;

  var query = { Origin: { $ne: 'user-submitted' } };

  if (req.query.gameId) {
    try { query.GameId = ObjectId(req.query.gameId); } catch (e) {}
  }

  if (req.query.characterId) {
    try {
      var charId = ObjectId(req.query.characterId);
      query.$or = [
        { 'Team1Players.CharacterIds': charId },
        { 'Team2Players.CharacterIds': charId },
      ];
    } catch (e) {}
  } else if (req.query.playerId) {
    try {
      var playerId = ObjectId(req.query.playerId);
      query.$or = [
        { 'Team1Players.Id': playerId },
        { 'Team2Players.Id': playerId },
      ];
    } catch (e) {}
  }

  Match.find(query, '_id')
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec(function (error, matches) {
      if (error) {
        console.error(error);
        return res.status(500).send({ matches: [] });
      }
      res.send({ matches: matches });
    });
}

// Filter matches where two characters are on the SAME team (both in Team1 OR both in Team2)
function queryByTeam(req, res) {
  const skip   = parseInt(req.query.skip)  || 0;
  const limit  = parseInt(req.query.limit) || 10;
  const gameId = req.query.gameId;
  const char1  = req.query.char1;
  const char2  = req.query.char2;

  if (!gameId) {
    return res.status(400).send({ error: 'gameId is required' });
  }

  const pipeline = [];

  pipeline.push({ $match: EXCLUDE_USER_SUBMITTED });

  // Filter by game first (uses GameId index)
  try {
    pipeline.push({ $match: { GameId: ObjectId(gameId) } });
  } catch (e) {
    return res.status(400).send({ error: 'Invalid gameId' });
  }

  // Team filter: both characters must appear in Team1 OR both in Team2
  if (char1 && char2) {
    let c1, c2;
    try { c1 = ObjectId(char1); c2 = ObjectId(char2); }
    catch (e) { return res.status(400).send({ error: 'Invalid character ids' }); }

    pipeline.push({
      $match: {
        $or: [
          { $and: [{ 'Team1Players.CharacterIds': c1 }, { 'Team1Players.CharacterIds': c2 }] },
          { $and: [{ 'Team2Players.CharacterIds': c1 }, { 'Team2Players.CharacterIds': c2 }] },
        ]
      }
    });
  } else if (char1 || char2) {
    const singleCharId = char1 || char2;
    let c1;
    try { c1 = ObjectId(singleCharId); } catch (e) {
      return res.status(400).send({ error: 'Invalid character id' });
    }
    pipeline.push({
      $match: {
        $or: [
          { 'Team1Players.CharacterIds': c1 },
          { 'Team2Players.CharacterIds': c1 },
        ]
      }
    });
  }

  pipeline.push({ $sort: { _id: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Math.min(limit, 20) });

  Match.aggregate(pipeline, function (error, matches) {
    if (error) { console.error(error); return res.status(500).send({ error }); }
    res.send({ matches });
  });
}

module.exports = { 
  addMatches, 
  getMatches, 
  patchMatch, 
  getMatch, 
  deleteMatch, 
  queryMatches, 
  patchMatches, 
  queryByCharacter, 
  getMatchupVideos,
  getSlugMatchupVideos,
  queryByPlayer,
  queryByGame,
  queryMatchesFeed,
  queryByTeam,
}