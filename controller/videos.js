var Video = require("../models/videos");
var ObjectId = require('mongodb').ObjectId;

// Add new Video
function addVideo(req, res) {
  var Url = req.body.Url;
  var ContentType = req.body.ContentType
  var ContentCreatorId = req.body.ContentCreatorId;
  var VideoType = req.body.VideoType;
  var StartTime = req.body.StartTime;
  var EndTime = req.body.EndTime;
  var GameId = req.body.GameId;
  var ComboIds = req.body.ComboIds.map(combo => {return ObjectId(combo)});
  var Player1Id = req.body.Player1Id;
  var Player2Id = req.body.Player2Id;
  var Player1CharacterId = req.body.Player1CharacterId;
  var Player1Character2Id = req.body.Player1Character2Id;
  var Player1Character3Id = req.body.Player1Character3Id;
  var Player2CharacterId = req.body.Player2CharacterId;
  var Player2Character2Id = req.body.Player2Character2Id;
  var Player2Character3Id = req.body.Player2Character3Id;
  var WinnerId = req.body.WinnerId;
  var Tags = req.body.Tags;
  
  console.log(ComboIds)
  var new_video = new Video({
    Url: Url,
    ContentType: ContentType,
    VideoType: VideoType,
    StartTime: StartTime,
    EndTime: EndTime,
    GameId: GameId,
    Tags: Tags
  })

  if(ContentCreatorId) {
    new_video.ContentCreatorId = ContentCreatorId;
  }
  if(ComboIds.length > 0) {
    new_video.ComboIds = ComboIds;
  }
  if(Player1Id) {
    new_video.Player1Id = Player1Id;
  }
  if(Player2Id) {
    new_video.Player2Id = Player2Id;
  }
  if(Player1CharacterId) {
    new_video.Player1CharacterId = Player1CharacterId;
  }
  if(Player1Character2Id) {
    new_video.Player1Character2Id = Player1Character2Id;
  }
  if(Player1Character3Id) {
    new_video.Player1Character3Id = Player1Character3Id;
  }
  if(Player2CharacterId) {
    new_video.Player2CharacterId = Player2CharacterId;
  }
  if(Player2Character2Id) {
    new_video.Player2Character2Id = Player2Character2Id;
  }
  if(Player2Character3Id) {
    new_video.Player2Character3Id = Player2Character3Id;
  }
  if(WinnerId) {
    new_video.WinnerId = WinnerId;
  }

  console.log(new_video);

  new_video.save(function (error) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!'
    })
  })
}

// Query Videos
function queryVideo(req, res) {
  var queries = [];
  var query = null;
  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    if (names.length > 0){
      for(var i = 0; i < names.length; i++){
        var query = {};
        if (names[i].includes('Id')) {
          query[names[i]] =  {'$eq': ObjectId(values[i])};
        }
        else {
          query[names[i]] =  {'$eq': values[i]}
        }
        queries.push(query);
      }
    }
  }

  var skip =  parseInt(req.query.skip);
  
  var aggregate = [    
    {$sort: {_id: -1}},
    {$lookup: {
      from: "games",
      localField: "GameId",
      foreignField: "_id",
      as: "Game"
      }
    },
    {$unwind: '$Game'},
    {$lookup: {
      from: "creators",
      localField: "ContentCreatorId",
      foreignField: "_id",
      as: "ContentCreator"
      }
    },
    {$unwind: {path:'$ContentCreator', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "players",
      localField: "Player1Id",
      foreignField: "_id",
      as: "Player1"
      }
    },
    {$unwind: {path:'$Player1', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "players",
      localField: "Player2Id",
      foreignField: "_id",
      as: "Player2"
      }
    },
    {$unwind: {path:'$Player2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1CharacterId",
      foreignField: "_id",
      as: "Player1Character"
      }
    },
    {$unwind: {path:'$Player1Character', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1Character2Id",
      foreignField: "_id",
      as: "Player1Character2"
      }
    },
    {$unwind: {path:'$Player1Character2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1Character3Id",
      foreignField: "_id",
      as: "Player1Character3"
      }
    },
    {$unwind: {path:'$Player1Character3', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2CharacterId",
      foreignField: "_id",
      as: "Player2Character"
      }
    },
    {$unwind: {path:'$Player2Character', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2Character2Id",
      foreignField: "_id",
      as: "Player2Character2"
      }
    },
    {$unwind: {path:'$Player2Character2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2Character3Id",
      foreignField: "_id",
      as: "Player2Character3"
      }
    },
    {$unwind: {path:'$Player2Character3', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: 'combos',
      localField: 'ComboIds',
      foreignField: '_id',
      as: 'Combo'
    }}, 
    {
      $unwind: {
        path: "$Combo",
        preserveNullAndEmptyArrays: true
      }
    },
    {$lookup: {
      from: 'characters',
      localField: 'Combo.CharacterId',
      foreignField: '_id',
      as: 'Combo.Character'
    }}, 
  ];

  if(queries.length > 0) {
    aggregate.push({$match: {$or: queries}});
  }

  aggregate.push({$skip: skip});
  aggregate.push({$limit: 5});  


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
    {$sort: {_id: -1}},
    {$lookup: {
      from: "games",
      localField: "GameId",
      foreignField: "_id",
      as: "Game"
      }
    },
    {$unwind: '$Game'},
    {$lookup: {
      from: "creators",
      localField: "ContentCreatorId",
      foreignField: "_id",
      as: "ContentCreator"
      }
    },
    {$unwind: {path:'$ContentCreator', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "players",
      localField: "Player1Id",
      foreignField: "_id",
      as: "Player1"
      }
    },
    {$unwind: {path:'$Player1', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "players",
      localField: "Player2Id",
      foreignField: "_id",
      as: "Player2"
      }
    },
    {$unwind: {path:'$Player2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1CharacterId",
      foreignField: "_id",
      as: "Player1Character"
      }
    },
    {$unwind: {path:'$Player1Character', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1Character2Id",
      foreignField: "_id",
      as: "Player1Character2"
      }
    },
    {$unwind: {path:'$Player1Character2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player1Character3Id",
      foreignField: "_id",
      as: "Player1Character3"
      }
    },
    {$unwind: {path:'$Player1Character3', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2CharacterId",
      foreignField: "_id",
      as: "Player2Character"
      }
    },
    {$unwind: {path:'$Player2Character', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2Character2Id",
      foreignField: "_id",
      as: "Player2Character2"
      }
    },
    {$unwind: {path:'$Player2Character2', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "characters",
      localField: "Player2Character3Id",
      foreignField: "_id",
      as: "Player2Character3"
      }
    },
    {$unwind: {path:'$Player2Character3', preserveNullAndEmptyArrays: true}},
    {$lookup: {
      from: "combos",
      localField: "ComboId",
      foreignField: "_id",
      as: "Combo"
      }
    },
  ];
  
  var videoId = req.params.id;
  aggregate.unshift({$match: {'_id': {'$eq': ObjectId(videoId)}}});
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
  Video.findById(req.params.id, 'ContentCreatorId GameId Player1Id Player2Id Player1CharacterId Player1Character2Id Player1Character3Id Player2CharacterId Player2Character2Id Player2Character3Id ComboId WinnerId Tags', function (error, video) {
    if (error) { console.error(error); }

    video.ContentCreatorId = req.body.ContentCreatorId;
    video.GameId = req.body.GameId;
    video.ComboId = req.body.ComboId;
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

module.exports = { addVideo, queryVideo, getVideo, patchVideo, deleteVideo}