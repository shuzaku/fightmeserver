var Montage = require("../models/montages");
var Character = require("../models/characters");
var ObjectId = require('mongodb').ObjectId;

function safeObjectId(value) {
  try { return new ObjectId(String(value)); } catch (e) { return null; }
}

async function resolveCharacterId(value) {
  if (!value) return null;
  const id = safeObjectId(value);
  if (id) return id;
  const found = await Character.findOne({
    Slug: new RegExp('^' + String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
  }).lean();
  return found ? found._id : null;
}

// Add new Montage
function addMontage(req, res) {
  var Players = req.body.Players.map(player => {return ObjectId(player)});
  var VideoUrl = req.body.VideoUrl;
  var GameId = req.body.GameId;
  var Characters = req.body.Characters.map(character => {return ObjectId(character.Id)});
  var Created = Date.now();
  var Updated = Date.now();
  var isDuplicate = Montage.find({ "VideoUrl" : VideoUrl}  , function (error, montages) {
    if (error) { console.error(error); }
    if(montages.length > 0){
      res.send({
        success: true,
        err: 'Montage already exist',
      });   
    }
    else {
      var new_montage = new Montage({
        Players: Players,
        VideoUrl: VideoUrl,
        GameId: GameId,
        Characters: Characters,
        Created: Created,
        Updated: Updated
      })
    
      new_montage.save(function (error,montage) {
        if (error) {
          console.log(error)
        }
        res.send({
          success: true,
          message: 'Post saved successfully!',
        })
      })
    }
  }).sort({ Name: 1 }) .limit(1);



}

// Fetch single match
function getMontage(req, res) {
  var montageId =  ObjectId(req.params.id);

  var aggregate = [
    {
      '$lookup': {
        'from': 'players', 
        'localField': 'Players', 
        'foreignField': '_id', 
        'as': 'Player'
      }
    },{
      '$lookup': {
        'from': 'characters', 
        'localField': 'Characters', 
        'foreignField': '_id', 
        'as': 'Characters'
      }
    },{
      '$lookup': {
        'from': 'games', 
        'localField': 'GameId', 
        'foreignField': '_id', 
        'as': 'Game'
      }
    },
  ]

  aggregate.unshift({$match: { _id: montageId }});

  Montage.aggregate(aggregate, function (error, montages) {
    if (error) { console.error(error); }
    res.send({
      montages: montages
    })
  })
}

// Query paginated list of montages
async function queryMontages(req, res) {
  var skip = parseInt(req.query.skip) || 0;
  var playerId = req.query.playerId || null;
  var characterId = req.query.characterId || null;

  var aggregate = [
    { $lookup: { from: 'players', localField: 'Players', foreignField: '_id', as: 'Player' } },
    { $lookup: { from: 'characters', localField: 'Characters', foreignField: '_id', as: 'Characters' } },
    { $lookup: { from: 'games', localField: 'GameId', foreignField: '_id', as: 'Game' } },
  ];

  if (playerId) {
    try {
      aggregate.unshift({ $match: { Players: ObjectId(playerId) } });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid playerId' });
    }
  }

  if (characterId) {
    const resolvedCharacterId = await resolveCharacterId(characterId);
    if (!resolvedCharacterId) {
      return res.status(400).json({ error: 'Invalid characterId' });
    }
    aggregate.unshift({ $match: { Characters: resolvedCharacterId } });
  }

  aggregate.push({ $sort: { _id: -1 } });
  aggregate.push({ $skip: skip });
  aggregate.push({ $limit: 10 });

  Montage.aggregate(aggregate, function (error, montages) {
    if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
    res.json({ montages: montages });
  });
}

module.exports = { addMontage, getMontage, queryMontages }