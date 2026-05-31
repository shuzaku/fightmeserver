var ComboClip = require("../models/combo-clips");
var Character = require("../models/characters");
var creatorResolve = require("../service/creator-resolve-service");
var ObjectId = require('mongodb').ObjectId;

var OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function safeObjectId(val) {
  if (OBJECT_ID_RE.test(String(val))) {
    try { return ObjectId(val); } catch(e) { return null; }
  }
  return null;
}

async function addComboClip(req, res) {
  var data = req.body;
  var tags = Array.isArray(data.Tags)
    ? data.Tags.map((t) => { try { return ObjectId(t); } catch(e) { return t; } })
    : [];

  // Upsert content creator from the video's channel / Twitter profile URL.
  if (!data.ContentCreatorId) {
    try {
      await creatorResolve.findOrCreateFromVideo({
        videoType: data.VideoType,
        url: data.Url,
        importVideoUrl: data.ImportVideoUrl,
      });
    } catch (creatorErr) {
      console.error('creator resolve on addComboClip:', creatorErr.message);
    }
  }

  var newClip = new ComboClip({
    CharacterId: data.CharacterId,
    Inputs: data.Inputs || [],
    Hits: data.Hits,
    Damage: data.Damage,
    Tags: tags,
    Url: data.Url,
    VideoType: data.VideoType,
    StartTime: data.StartTime,
    EndTime: data.EndTime,
    SubmittedBy: data.SubmittedBy,
  });

  newClip.save(function (error, clip) {
    if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
    res.json({ success: true, id: clip._id });
  });
}

function patchComboClip(req, res) {
  var data = req.body;
  var tags = Array.isArray(data.Tags)
    ? data.Tags.map((t) => { try { return ObjectId(t); } catch(e) { return t; } })
    : [];

  ComboClip.findById(req.params.id, function (error, clip) {
    if (error) { return res.status(500).json({ error: error.message }); }
    if (!clip) { return res.status(404).json({ error: 'Not found' }); }

    clip.CharacterId = data.CharacterId;
    clip.Inputs = data.Inputs || [];
    clip.Hits = data.Hits;
    clip.Damage = data.Damage;
    clip.Tags = tags;
    clip.Url = data.Url;
    clip.VideoType = data.VideoType;
    clip.StartTime = data.StartTime;
    clip.EndTime = data.EndTime;
    clip.UpdatedBy = data.UpdatedBy;

    clip.save(function (err) {
      if (err) { return res.status(500).json({ error: err.message }); }
      res.json({ success: true });
    });
  });
}

function deleteComboClip(req, res) {
  ComboClip.deleteOne({ _id: req.params.id }, function (error) {
    if (error) { return res.status(500).json({ error: error.message }); }
    res.json({ success: true });
  });
}

function getComboClip(req, res) {
  var id = safeObjectId(req.params.id);
  if (!id) { return res.status(400).json({ error: 'Invalid id' }); }

  var aggregate = [
    { $match: { _id: id } },
    {
      $lookup: {
        from: 'characters',
        localField: 'CharacterId',
        foreignField: '_id',
        as: 'Character'
      }
    },
    {
      $unwind: {
        path: '$Character',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'games',
        localField: 'Character.GameId',
        foreignField: '_id',
        as: 'Game'
      }
    },
    {
      $unwind: {
        path: '$Game',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  ComboClip.aggregate(aggregate, function (error, comboClip) {
    if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
    res.json({ comboClip: comboClip });
  });
}

function queryComboClips(req, res) {
  var skip = parseInt(req.query.skip) || 0;
  var limit = 20;
  var queryName = req.query.queryName;
  var queryValue = req.query.queryValue;

  var buildAggregate = function (characterIdFilter, gameIdFilter) {
    var aggregate = [
      {
        $lookup: {
          from: 'characters',
          localField: 'CharacterId',
          foreignField: '_id',
          as: 'Character'
        }
      },
      {
        $unwind: {
          path: '$Character',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'games',
          localField: 'Character.GameId',
          foreignField: '_id',
          as: 'Game'
        }
      },
      {
        $unwind: {
          path: '$Game',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    if (characterIdFilter) {
      aggregate.unshift({ $match: { CharacterId: characterIdFilter } });
    } else if (gameIdFilter) {
      aggregate.push({ $match: { 'Character.GameId': gameIdFilter } });
    }

    aggregate.push({ $sort: { createdAt: -1 } });
    aggregate.push({ $skip: skip });
    aggregate.push({ $limit: limit });
    return aggregate;
  };

  var runQuery = function (characterIdFilter, gameIdFilter) {
    var aggregate = buildAggregate(characterIdFilter, gameIdFilter);
    ComboClip.aggregate(aggregate, function (error, comboClips) {
      if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
      res.json({ comboClips: comboClips });
    });
  };

  if (queryName === 'CharacterId' && queryValue) {
    var charObjectId = safeObjectId(queryValue);
    if (charObjectId) {
      runQuery(charObjectId, null);
    } else {
      // Treat as slug — look up character first
      Character.findOne({ Slug: queryValue }, '_id', function (err, character) {
        if (err || !character) {
          return res.json({ comboClips: [] });
        }
        runQuery(character._id, null);
      });
    }
  } else if (queryName === 'GameId' && queryValue) {
    var gameObjectId = safeObjectId(queryValue);
    if (!gameObjectId) { return res.json({ comboClips: [] }); }
    runQuery(null, gameObjectId);
  } else {
    runQuery(null, null);
  }
}

module.exports = { addComboClip, patchComboClip, deleteComboClip, getComboClip, queryComboClips };
