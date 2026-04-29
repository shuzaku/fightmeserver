var ComboClip = require("../models/combo-clips");
var ObjectId = require('mongodb').ObjectId;

// Fetch single combo
function getComboClip(req, res) {
  var comboClipId = ObjectId(req.params.id);
  var aggregate = [
    {
      '$lookup': {
        'from': 'combos',
        'localField': 'ComboId',
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
      '$lookup': {
        'from': 'characters',
        'localField': 'Combo.CharacterId',
        'foreignField': '_id',
        'as': 'Character'
      }
    },
    {
      '$unwind': {
        'path': '$Character',
        'preserveNullAndEmptyArrays': true
      }
    },
    {
      '$lookup': {
        'from': 'games',
        'localField': 'Character.GameId',
        'foreignField': '_id',
        'as': 'Game'
      }
    },
    {
      '$unwind': {
        'path': '$Game',
        'preserveNullAndEmptyArrays': true
      }
    },
    {
      '$lookup': {
        'from': 'videos',
        'localField': 'VideoId',
        'foreignField': '_id',
        'as': 'Video'
      }
    },
    {
      '$unwind': {
        'path': '$Video',
        'preserveNullAndEmptyArrays': true
      }
    },
    {
      '$addFields': {
        'Url': {
          '$ifNull': ['$Video.Url', '$Url']
        },
        'VideoType': {
          '$ifNull': ['$Video.VideoType', '$VideoType']
        }
      }
    }
  ]

  aggregate.unshift({ $match: { _id: ObjectId(comboClipId) } });
  ComboClip.aggregate(aggregate, function (error, comboClip) {
    if (error) { console.error(error); }
    res.send({
      comboClip: comboClip
    })
  })
}

function queryComboClips(req, res) {
  var skip = parseInt(req.query.skip) || 0;
  var limit = 20;

  var aggregate = [
    {
      '$lookup': {
        'from': 'combos',
        'localField': 'ComboId',
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
      '$lookup': {
        'from': 'videos',
        'localField': 'VideoId',
        'foreignField': '_id',
        'as': 'Video'
      }
    },
    {
      '$unwind': {
        'path': '$Video',
        'preserveNullAndEmptyArrays': true
      }
    }
  ];

  if (req.query.queryName === 'CharacterId' && req.query.queryValue) {
    aggregate.push({
      '$match': { 'Combo.CharacterId': ObjectId(req.query.queryValue) }
    });
  }

  aggregate.push({ '$sort': { 'createdAt': -1 } });
  aggregate.push({ '$skip': skip });
  aggregate.push({ '$limit': limit });

  ComboClip.aggregate(aggregate, function (error, comboClips) {
    if (error) { console.error(error); }
    res.send({
      videos: comboClips.map(clip => ({
        ...clip,
        ComboClip: clip, // Map to expected structure if needed, or frontend can adjust
        ContentType: 'Combo' // Ensure compatibility
      }))
    })
  })
}

module.exports = { getComboClip, queryComboClips }