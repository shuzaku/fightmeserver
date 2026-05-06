var videoService = require("../service/videos-service");
var Video = require("../models/videos");
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");
var ObjectId = require('mongodb').ObjectId;

// Helper function to safely convert to ObjectId
function safeObjectId(value) {
    if (!value || value === 'null' || value === 'undefined' || value === '') {
        return null;
    }
    try {
        // Check if it's a valid 24-character hex string
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            return ObjectId(value);
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Add new Video
function addVideo(req, res) {
    const isBulk = req.query.bulk;
    videoService.addVideo(req.body, isBulk)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            // Check if it's a duplicate URL error
            if (error.success === false && error.message.includes('already exists')) {
                res.status(409).send(error); // 409 Conflict
            } else {
                res.status(500).send({
                    success: false,
                    message: 'Error saving video',
                    error: error.message
                });
            }
        });
}
// Query Videos
function fetchVideos(req, res) {
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var aggregate = [
    {
      '$sort': 
        {'_id': -1}
      
    },{
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    }, {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    },{
      '$lookup': {
        'from': 'combo-clips', 
        'localField': 'Url', 
        'foreignField': 'Url', 
        'as': 'ComboClip'
      }
    }, {
      '$unwind': {
        'path': '$ComboClip', 
        'preserveNullAndEmptyArrays': true
      }
    },{
      '$lookup': {
        'from': 'combos', 
        'localField': 'ComboClip.ComboId', 
        'foreignField': '_id', 
        'as': 'Combo'
      }
    },{
      '$unwind': {
        'path': '$Combo', 
        'preserveNullAndEmptyArrays': true
      }
    },
  ];

  
  aggregate.push({$skip: skip});
  aggregate.push({$limit: limit});  
  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}

// Query Videos
// Pipeline strategy: filter & paginate on native video fields FIRST, then enrich
// with lookups on only the paginated documents. Cross-collection filters (CharacterId,
// PlayerId) require lookups before filtering, but ContentType and GameId are native.
function queryVideo(req, res) {
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var filter = req.query.filter;
  var tagFilter = req.query.tag ? safeObjectId(req.query.tag) : null;

  // Separate native (video-collection) filters from cross-collection filters
  var nativeMatch = {};       // applied before any lookups
  var crossCollectionFilters = []; // applied after lookups, before pagination
  var needsVideoId = false;

  // --- Parse query params ---
  if (req.query.queryName || req.query.queryValue) {
    var names = req.query.queryName.split(',');
    var values = req.query.queryValue.split(',');

    for (var i = 0; i < names.length; i++) {
      switch (names[i]) {
        case 'PlayerId': {
          var playerId = safeObjectId(values[i]);
          if (!playerId) break;
          crossCollectionFilters.push({ $or: [
            { 'Team1Players': { $elemMatch: { _id: playerId } } },
            { 'Team2Players': { $elemMatch: { _id: playerId } } },
          ]});
          break;
        }
        case 'PlayerSlug': {
          crossCollectionFilters.push({ $or: [
            { 'Team1Players': { $elemMatch: { Slug: values[i] } } },
            { 'Team2Players': { $elemMatch: { Slug: values[i] } } },
          ]});
          break;
        }
        case 'PlayerMatchupCharacterId': {
          var pmPlayerId = safeObjectId(values[names.indexOf('PlayerId')]);
          var pmCharId   = safeObjectId(values[i]);
          if (!pmPlayerId || !pmCharId) break;
          crossCollectionFilters.push({ $or: [
            { $and: [{ Team1Players: { $elemMatch: { _id: pmPlayerId } } }, { Team2PlayerCharacters: { $elemMatch: { _id: pmCharId } } }] },
            { $and: [{ Team2Players: { $elemMatch: { _id: pmPlayerId } } }, { Team1PlayerCharacters: { $elemMatch: { _id: pmCharId } } }] },
          ]});
          break;
        }
        case 'CharacterMatchupCharacterId': {
          var cmCharId        = safeObjectId(values[names.indexOf('CharacterId')]);
          var cmMatchupCharId = safeObjectId(values[i]);
          if (!cmCharId || !cmMatchupCharId) break;
          crossCollectionFilters.push({ $or: [
            { $and: [{ Team1PlayerCharacters: { $elemMatch: { _id: cmCharId } } }, { Team2PlayerCharacters: { $elemMatch: { _id: cmMatchupCharId } } }] },
            { $and: [{ Team2PlayerCharacters: { $elemMatch: { _id: cmCharId } } }, { Team1PlayerCharacters: { $elemMatch: { _id: cmMatchupCharId } } }] },
          ]});
          break;
        }
        case 'CharacterId': {
          var characterId = safeObjectId(values[i]);
          if (!characterId) break;
          crossCollectionFilters.push({ $or: [
            { Team1PlayerCharacters: { $elemMatch: { _id: characterId } } },
            { Team2PlayerCharacters: { $elemMatch: { _id: characterId } } },
            { MontageCharacters:     { $elemMatch: { _id: characterId } } },
            { 'Combo.CharacterId': { $eq: characterId } },
          ]});
          break;
        }
        case 'CharacterSlug': {
          crossCollectionFilters.push({ $or: [
            { Team1PlayerCharacters: { $elemMatch: { Slug: values[i] } } },
            { Team2PlayerCharacters: { $elemMatch: { Slug: values[i] } } },
            { MontageCharacters:     { $elemMatch: { Slug: values[i] } } },
          ]});
          break;
        }
        case 'VideoId': {
          var videoId = safeObjectId(values[i]);
          if (!videoId) break;
          nativeMatch['_id'] = { $eq: videoId };
          needsVideoId = true;
          break;
        }
        default: {
          if (names[i].includes('Id')) {
            var idVal = safeObjectId(values[i]);
            if (!idVal) break;
            nativeMatch[names[i]] = { $eq: idVal };
          } else {
            nativeMatch[names[i]] = { $eq: values[i] };
          }
        }
      }
    }
  }

  // Apply ContentType filter natively (it lives on the video document)
  if (filter === 'Match')   nativeMatch.ContentType = 'Match';
  else if (filter === 'Combo')   nativeMatch.ContentType = 'Combo';
  else if (filter === 'Montage') nativeMatch.ContentType = 'Montage';

  var hasCrossCollection = crossCollectionFilters.length > 0 || tagFilter;

  // --- Build the pipeline ---
  var aggregate = [];

  // PHASE 1 — native filters (uses indexes on ContentType, GameId, _id)
  if (Object.keys(nativeMatch).length > 0) {
    aggregate.push({ $match: nativeMatch });
  }

  // PHASE 2 — paginate EARLY when we have no cross-collection conditions
  // This means lookups below only run on the ~5 result documents, not the whole collection
  if (!hasCrossCollection) {
    aggregate.push({ $sort: sortObj });
    aggregate.push({ $skip: skip });
    aggregate.push({ $limit: limit });
  }

  // PHASE 3 — enrichment lookups (now on a small set when early-paginated)
  aggregate.push(
    { $lookup: { from: 'games',       localField: 'GameId', foreignField: '_id', as: 'Game' } },
    { $unwind: '$Game' },
    { $lookup: { from: 'montages',    localField: 'Url', foreignField: 'VideoUrl', as: 'Montage' } },
    { $unwind: { path: '$Montage', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'characters',  localField: 'Montage.Characters', foreignField: '_id', as: 'MontageCharacters' } },
    { $lookup: { from: 'matches',     localField: 'Url', foreignField: 'VideoUrl', as: 'Match' } },
    { $unwind: { path: '$Match', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'players',     localField: 'Match.Team1Players.Id', foreignField: '_id', as: 'Team1Players' } },
    { $lookup: { from: 'players',     localField: 'Match.Team2Players.Id', foreignField: '_id', as: 'Team2Players' } },
    { $lookup: { from: 'characters',  localField: 'Match.Team1Players.CharacterIds', foreignField: '_id', as: 'Team1PlayerCharacters' } },
    { $lookup: { from: 'characters',  localField: 'Match.Team2Players.CharacterIds', foreignField: '_id', as: 'Team2PlayerCharacters' } },
    { $lookup: { from: 'combo-clips', localField: 'Url', foreignField: 'Url', as: 'ComboClip' } },
    { $unwind: { path: '$ComboClip', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'creators',    localField: 'ContentCreatorId', foreignField: '_id', as: 'ContentCreator' } },
    { $unwind: { path: '$ContentCreator', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'combos',      localField: 'ComboClip.ComboId', foreignField: '_id', as: 'Combo' } },
    { $unwind: { path: '$Combo', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'tags',        localField: 'Combo.Tags', foreignField: '_id', as: 'Combo.Tags' } },
    { $lookup: { from: 'characters',  localField: 'Combo.CharacterId', foreignField: '_id', as: 'Character' } },
    { $unwind: { path: '$Character', preserveNullAndEmptyArrays: true } },
    { $addFields: { Id: '$_id' } }
  );

  // PHASE 4 — cross-collection filters + tag filter (applied after lookups)
  if (crossCollectionFilters.length > 0) {
    aggregate.push({ $match: { $and: crossCollectionFilters } });
  }
  if (tagFilter) {
    aggregate.push({ $match: { 'Combo.Tags': { $elemMatch: { _id: tagFilter } } } });
  }

  // PHASE 5 — late pagination for cross-collection queries
  if (hasCrossCollection) {
    aggregate.push({ $sort: sortObj });
    aggregate.push({ $skip: skip });
    aggregate.push({ $limit: limit });
  }

  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({ videos: videos });
  });
}

// Query by character
function queryVideoByCharacter(req, res) {
  var queries = [];
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var aggregate = [ 
    {
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    }, {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team1Players.Id', 
        'foreignField': '_id', 
        'as': 'Team1Players'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team2Players.Id', 
        'foreignField': '_id', 
        'as': 'Team2Players'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team1Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Team1PlayerCharacters'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team2Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Team2PlayerCharacters'
      }
    }, {
      '$lookup': {
        'from': 'combo-clips', 
        'localField': 'Url', 
        'foreignField': 'Url', 
        'as': 'ComboClip'
      }
    }, {
      '$unwind': {
        'path': '$ComboClip', 
        'preserveNullAndEmptyArrays': true
      }
    },{
      '$lookup': {
        'from': 'combos', 
        'localField': 'ComboClip.ComboId', 
        'foreignField': '_id', 
        'as': 'Combo'
      }
    },{
      '$unwind': {
        'path': '$Combo', 
        'preserveNullAndEmptyArrays': true
      }
    },{
      '$lookup': {
        'from': 'characters', 
        'localField': 'Combo.CharacterId', 
        'foreignField': '_id', 
        'as': 'Character'
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
          var characterId = safeObjectId(values[i]);
          if (!characterId) break;
          var characterQuery= [
            {"Team1PlayerCharacters": { '$elemMatch': { '_id':  characterId } }},
            {"Team2PlayerCharacters": { '$elemMatch': { '_id':  characterId } }},
            {'Combo.CharacterId': {'$eq': characterId}},
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
  aggregate.push({$sort: sortObj});  
  aggregate.push({$skip: skip});
  aggregate.push({$limit: limit});  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}

// Query by player
function queryVideoByPlayer(req, res) {
  var queries = [];
  var query = null;
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var filter = req.query.filter;
  var tagFilter = req.query.tag ? safeObjectId(req.query.tag): null;
  var aggregate = [{
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    }, {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team1Players.Id', 
        'foreignField': '_id', 
        'as': 'Team1Players'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team2Players.Id', 
        'foreignField': '_id', 
        'as': 'Team2Players'
      }
    }
  ];

  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    var query = {};
    //parse query for player id
    for(var i = 0; i < names.length; i++){
      var query = {};

      switch (names[i]){
        case 'PlayerId':
          var playerId = safeObjectId(values[i]);
          if (!playerId) break;
          var playerQuery= [
            {"Team1Players": { '$elemMatch': { '_id':  playerId } }},
            {"Team2Players": { '$elemMatch': { '_id':  playerId } }}
          ];  
          queries.push({$or: playerQuery});
        break

        case 'PlayerSlug':
          var playerQuery= [
            {"Team1Players": { '$elemMatch': { 'Slug': values[i] } }},
            {"Team2Players": { '$elemMatch': { 'Slug': values[i] } }}
          ];  
          queries.push({$or: playerQuery});
        break
      }
    }
  };

  if(queries.length > 0) {
    aggregate.push({$match: {$and: queries}});
  }

  aggregate.push({$sort: sortObj})
  aggregate.push({$skip: skip});
  aggregate.push({$limit: limit});  
  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}

// Query by game
function queryVideoByGame(req, res) {
  var queries = [];
  var query = null;
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var filter = req.query.filter;
  var aggregate = [
    {
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    }, {
      '$unwind': '$Game'
    },{
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    },{
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      } 
    }
  ];

  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    var query = {};
    for(var i = 0; i < names.length; i++){
      var query = {};
      switch (names[i]){
        default: 
          if(names[i].includes('Id')){
            var idValue = safeObjectId(values[i]);
            if (!idValue) break;
            query[names[i]] =  {'$eq': idValue};
            queries.push(query);
          } else {
            query[names[0]] =  {'$eq': values[0]};
            queries.push(query);
          }
      }
    }
  };

  if(queries.length > 0) {
    aggregate.push({$match: {$and: queries}});
  }

  aggregate.push({$sort: sortObj})
  aggregate.push({$skip: skip});
  aggregate.push({$limit: limit});  
  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}

// Fetch single Video
function getVideo(req, res) {
  var aggregate = [
    {
      '$sort': 
        {'_id': -1}
      
    },
    {
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    }, {
      '$unwind': '$Game'
    }, {
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    }, {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'creators', 
        'localField': 'ContentCreatorId', 
        'foreignField': '_id', 
        'as': 'ContentCreator'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team1Players.Id', 
        'foreignField': '_id', 
        'as': 'Match.Team1Player'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team2Players.Id', 
        'foreignField': '_id', 
        'as': 'Match.Team2Player'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team1Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Match.Team1PlayerCharacters'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team2Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Match.Team2PlayerCharacters'
      }
    }, {
      '$unwind': {
        'path': '$ContentCreator', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$unwind': {
        'path': '$Combos', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'combos', 
        'localField': 'Combos.Id', 
        'foreignField': '_id', 
        'as': 'Combo'
      }
    }, {
      '$unwind': {
        'path': '$Combo', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Combo.CharacterId', 
        'foreignField': '_id', 
        'as': 'Combo.Character'
      }
    }, {
      '$unwind': {
        'path': '$Combo.Character', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'tags', 
        'localField': 'Combo.Tags', 
        'foreignField': '_id', 
        'as': 'Combo.ComboTags'
      }
    }, {
      '$addFields': {
        'Combo.StartTime': '$Combos.StartTime', 
        'Combo.EndTime': '$Combos.Endtime', 
        'ComboCharacterId': '$Combo.CharacterId', 
        'ComboId': '$Combo._id', 
        'Id': '$_id'
      }
    }
  ];
  var videoId = req.params.id;
  var validVideoId = safeObjectId(videoId);
  if (!validVideoId) {
    res.status(400).send({ error: 'Invalid video ID format' });
    return;
  }
  aggregate.unshift({$match: {'_id': {'$eq': validVideoId}}});
  Video.aggregate(aggregate, function (error, video) {
    if (error) { console.error(error); }
    res.send({
      video: video
    })
    aggregate = [];
  })
  
}

// Update a Video
function patchVideo(req, res) {
  Video.findById(req.params.id, 'ContentCreatorId GameId Player1Id Player2Id Player1CharacterId Player1Character2Id Player1Character3Id Player2CharacterId Player2Character2Id Player2Character3Id Combos WinnerId Tags UpdatedDate', function (error, video) {
    if (error) { console.error(error); }

    video.ContentCreatorId = req.body.ContentCreatorId;
    var gameId = safeObjectId(req.body.GameId);
    if (!gameId) {
      res.status(400).send({ error: 'Invalid GameId format' });
      return;
    }
    video.GameId = gameId;
    // Validate all combo IDs before processing
    for (var j = 0; j < req.body.Combos.length; j++) {
      if (!safeObjectId(req.body.Combos[j].Id)) {
        res.status(400).send({ error: 'Invalid Combo Id format at index ' + j });
        return;
      }
    }
    video.Combos = req.body.Combos.map(combo => {
      return {
        Id: safeObjectId(combo.Id),
        StartTime: combo.StartTime,
        EndTime: combo.EndTime
      }
    });
    video.Player1Id = req.body.Player1Id;
    video.Player2Id = req.body.Player2Id;
    video.Player1CharacterId = req.body.Player1CharacterId;
    video.Player1Character2Id = req.body.Player1Character2Id;
    video.Player1Character3Id = req.body.Player1Character3Id;
    video.Player2CharacterId = req.body.Player2CharacterId;
    video.Player2Character2Id = req.body.Player2Character2Id;
    video.Player2Character3Id = req.body.Player2Character3Id;
    video.WinnerId = req.body.WinnerId;
    video.Tags = req.body.Tags;
    video.UpdatedDate = Date.now();

    video.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a Video
function deleteVideo(req, res) {
  Video.remove({
    _id: req.params.id
  }, function (err) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

// Fetch all Tag
function getVideos(req, res) {
  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var aggregate = [
    {'$sort': sortObj},
    {
      '$lookup': {
        'from': 'combos', 
        'localField': 'Combos.Id', 
        'foreignField': '_id', 
        'as': 'Combo'
      }
    },
    {
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    },
    {
      '$unwind': {
        'path': '$Combos', 
        'preserveNullAndEmptyArrays': true
      }
    }, 
    {
      '$lookup': {
        'from': 'combos', 
        'localField': 'Combos.Id', 
        'foreignField': '_id', 
        'as': 'Combo'
      }
    },
    {
      '$unwind': {
        'path': '$Combo', 
        'preserveNullAndEmptyArrays': true
      }
    }, 
    {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    }, 
  ]

  aggregate.push({$skip: skip});
  aggregate.push({$limit: limit});  
  aggregate.push({$project:{
    "Match._id": 1, 
    "Combo":{
      "_id": 1,
      "StartTime" :1,
      "EndTime": 1
    },
    "ContentType": 1
  }})

  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}

function getComboVideo(req, res) {
  var comboUrl =  req.params.url;

  var aggregate = [
    {
      '$match': {
          'Url': comboUrl
      }
    },
    {
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    }, 
    {
      '$unwind': '$Game'
    }, 
    {
      '$lookup': {
        'from': 'creators', 
        'localField': 'ContentCreatorId', 
        'foreignField': '_id', 
        'as': 'ContentCreator'
      }
    }, 
    {
      '$unwind': {
        'path': '$ContentCreator', 
        'preserveNullAndEmptyArrays': true
      }
    },

  ];

  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
    aggregate = [];
  })
}

function getMatchVideo(req, res) {
  var matchUrl = req.params.url || '';
  try {
    matchUrl = decodeURIComponent(matchUrl);
  } catch (e) {
    /* ignore */
  }

  // Match documents where Url equals the param, or contains it (e.g. bare YouTube id vs full watch URL)
  var urlConditions = [{ Url: matchUrl }];
  if (matchUrl && typeof matchUrl === 'string' && !/^https?:\/\//i.test(matchUrl.trim())) {
    var escaped = matchUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    urlConditions.push({ Url: new RegExp(escaped, 'i') });
  }

  var aggregate = [
    {
      '$match': { $or: urlConditions },
    },
    {
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    },
    {
      '$unwind': {
        path: '$Game',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      '$lookup': {
        'from': 'creators', 
        'localField': 'ContentCreatorId', 
        'foreignField': '_id', 
        'as': 'ContentCreator'
      }
    }, 
    {
      '$unwind': {
        'path': '$ContentCreator', 
        'preserveNullAndEmptyArrays': true
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 1 },
  ];

  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
    aggregate = [];
  })
}

// Query Videos
function getMatchupVideos(req, res) {
  var queries = [];

  var skip = parseSkip(req);
  var limit = parseLimit(req, 5, 20);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  var aggregate = [
    {
      '$sort': sortObj
    },
    {
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    }, {
      '$unwind': '$Game'
    }, {
      '$lookup': {
        'from': 'matches', 
        'localField': 'Url', 
        'foreignField': 'VideoUrl', 
        'as': 'Match'
      }
    }, {
      '$unwind': {
        'path': '$Match', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'creators', 
        'localField': 'ContentCreatorId', 
        'foreignField': '_id', 
        'as': 'ContentCreator'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team1Players.Id', 
        'foreignField': '_id', 
        'as': 'Team1Players'
      }
    }, {
      '$lookup': {
        'from': 'players', 
        'localField': 'Match.Team2Players.Id', 
        'foreignField': '_id', 
        'as': 'Team2Players'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team1Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Team1PlayerCharacters'
      }
    }, {
      '$lookup': {
        'from': 'characters', 
        'localField': 'Match.Team2Players.CharacterIds', 
        'foreignField': '_id', 
        'as': 'Team2PlayerCharacters'
      }
    }, {
      '$unwind': {
        'path': '$ContentCreator', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$addFields': {
        'Id': '$_id'
      }
    }
  ];
  var character1 = safeObjectId(req.query.character1);
  var character2 = safeObjectId(req.query.character2);
  if (!character1 || !character2) {
    res.status(400).send({ error: 'Invalid character ID format' });
    return;
  }
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
  aggregate.push({$limit: limit});  
  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}





// Fetch a video by its associated match ID
function getVideoByMatchId(req, res) {
  var Match = require('../models/matches');
  var matchId = req.params.matchId;
  var validMatchId = safeObjectId(matchId);
  if (!validMatchId) {
    return res.status(400).send({ error: 'Invalid match ID format' });
  }

  // Start from the match so we don't scan every video; join videos with flexible Url / VideoUrl matching
  var aggregate = [
    { $match: { _id: validMatchId } },
    {
      $lookup: {
        from: 'videos',
        let: { vu: '$VideoUrl' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$Url', '$$vu'] },
                  {
                    $and: [
                      { $gt: [{ $strLenCP: { $ifNull: ['$$vu', ''] } }, 0] },
                      { $gt: [{ $strLenCP: { $ifNull: ['$Url', ''] } }, 0] },
                      {
                        $or: [
                          {
                            $gte: [
                              {
                                $indexOfBytes: [
                                  { $ifNull: ['$Url', ''] },
                                  { $ifNull: ['$$vu', ''] },
                                ],
                              },
                              0,
                            ],
                          },
                          {
                            $gte: [
                              {
                                $indexOfBytes: [
                                  { $ifNull: ['$$vu', ''] },
                                  { $ifNull: ['$Url', ''] },
                                ],
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 1 },
        ],
        as: 'Vid',
      },
    },
    {
      $unwind: {
        path: '$Vid',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$Vid',
            {
              Match: {
                _id: '$_id',
                Team1Players: '$Team1Players',
                Team2Players: '$Team2Players',
                VideoUrl: '$VideoUrl',
                GameId: '$GameId',
                StartTime: '$StartTime',
                EndTime: '$EndTime',
              },
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'games',
        localField: 'GameId',
        foreignField: '_id',
        as: 'Game',
      },
    },
    {
      $unwind: {
        path: '$Game',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'creators',
        localField: 'ContentCreatorId',
        foreignField: '_id',
        as: 'ContentCreator',
      },
    },
    {
      $lookup: {
        from: 'players',
        localField: 'Match.Team1Players.Id',
        foreignField: '_id',
        as: 'Match.Team1Player',
      },
    },
    {
      $lookup: {
        from: 'players',
        localField: 'Match.Team2Players.Id',
        foreignField: '_id',
        as: 'Match.Team2Player',
      },
    },
    {
      $lookup: {
        from: 'characters',
        localField: 'Match.Team1Players.CharacterIds',
        foreignField: '_id',
        as: 'Match.Team1PlayerCharacters',
      },
    },
    {
      $lookup: {
        from: 'characters',
        localField: 'Match.Team2Players.CharacterIds',
        foreignField: '_id',
        as: 'Match.Team2PlayerCharacters',
      },
    },
    {
      $unwind: {
        path: '$ContentCreator',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$Combos',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'combos',
        localField: 'Combos.Id',
        foreignField: '_id',
        as: 'Combo',
      },
    },
    {
      $unwind: {
        path: '$Combo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'characters',
        localField: 'Combo.CharacterId',
        foreignField: '_id',
        as: 'Combo.Character',
      },
    },
    {
      $unwind: {
        path: '$Combo.Character',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'tags',
        localField: 'Combo.Tags',
        foreignField: '_id',
        as: 'Combo.ComboTags',
      },
    },
    {
      $addFields: {
        'Combo.StartTime': '$Combos.StartTime',
        'Combo.EndTime': '$Combos.Endtime',
        ComboCharacterId: '$Combo.CharacterId',
        ComboId: '$Combo._id',
        Id: '$_id',
      },
    },
  ];

  Match.aggregate(aggregate, function (error, video) {
    if (error) {
      console.error(error);
      return res.status(500).send({ error });
    }
    res.send({ video: video });
  });
}

// Increment view count for a video
function incrementViews(req, res) {
  var videoId = safeObjectId(req.params.id);
  if (!videoId) {
    return res.status(400).send({ success: false, message: 'Invalid video ID' });
  }

  Video.findByIdAndUpdate(
    videoId,
    { $inc: { Views: 1 } },
    { new: true, select: 'Views' },
    function (error, video) {
      if (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: 'Error updating views' });
      }
      if (!video) {
        return res.status(404).send({ success: false, message: 'Video not found' });
      }
      res.send({ success: true, views: video.Views });
    }
  );
}

module.exports = { addVideo, queryVideo, queryVideoByCharacter, queryVideoByPlayer, queryVideoByGame, getVideo, getVideoByMatchId, patchVideo, deleteVideo, getVideos, getComboVideo, getMatchVideo, getMatchupVideos, fetchVideos, incrementViews }