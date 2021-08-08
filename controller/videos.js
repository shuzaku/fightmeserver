var Video = require("../models/videos");
var ObjectId = require('mongodb').ObjectId;

// Add new Video
function addVideo(req, res) {
  if(!req.query.bulk){
    var Url = req.body.Url;
    var ContentType = req.body.ContentType
    var ContentCreatorId = req.body.ContentCreatorId;
    var VideoType = req.body.VideoType;
    var GameId = req.body.GameId;
    var StartTime = req.body.StartTime;
    var EndTime = req.body.EndTime;
    var Combos = ContentType === 'Combo' ? req.body.Combos.map(combo => {
      return {
        Id: ObjectId(combo.Id),
        StartTime: combo.StartTime,
        Endtime: combo.EndTime
      }
    }): null;
    var Tags = req.body.Tags;
    
    var new_video = new Video({
      Url: Url,
      ContentType: ContentType,
      VideoType: VideoType,
      StartTime: StartTime,
      EndTime: EndTime,
      GameId: GameId,
      Tags: Tags,
      Combos: Combos
    })


    if(ContentCreatorId) {
      new_video.ContentCreatorId = ContentCreatorId;
    }
    
    new_video.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true,
        message: 'Post saved successfully!'
      })
    })
  } else {
    Video.insertMany(req.body, function(error,videos){
      if (error) {
        console.log(error)
      }
      res.send({
        success: true,
        message: 'Videos saved successfully!',
        videos: videos
      })      
    })    
  }
}

// Query Videos
function queryVideo(req, res) {
  var queries = [];
  var query = null;
  var skip =  parseInt(req.query.skip);
  var sort = req.query.sort || '_id';
  var filter = req.query.filter;
  var tagFilter = req.query.tag ? ObjectId(req.query.tag): null;
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
        'as': 'Combo.Tags'
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

  if (req.query.queryName || req.query.queryValue){
    var names = req.query.queryName.split(",");
    var values = req.query.queryValue.split(",");
    
    if (names.length > 1){
      for(var i = 0; i < names.length; i++){
        var query = {};
        if (names[i].includes('Id') || names[i].includes('id')) {
          query[names[i]] =  {'$eq': ObjectId(values[i])};
        }
        else {
          query[names[i]] =  {'$eq': values[i]}
        }
        queries.push(query);
      }
    }
    else if(names[0] === 'PlayerId'){
      var playerQuery= [
        {"Team1Players": { '$elemMatch': { '_id':  ObjectId(values[0]) } }},
        {"Team2Players": { '$elemMatch': { '_id':  ObjectId(values[0]) } }}
      ];
      aggregate.push({$match: {$or: playerQuery}});
    }
    else if(names[0] === 'CharacterId'){
      var characterQuery= [
        {"Team1PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[0]) } }},
        {"Team2PlayerCharacters": { '$elemMatch': { '_id':  ObjectId(values[0]) } }},
        {'Combo.CharacterId': {'$eq': ObjectId(values[0])}}
      ];
      aggregate.push({$match: {$or: characterQuery}});
    }
    else {
      var query = {};
      if(names[0].includes('Id')){
        query[names[0]] =  {'$eq': ObjectId(values[0])};
        queries.push(query);
      } else {
        query[names[0]] =  {'$eq': values[0]};
        queries.push(query);
      }
    }
  }

  if(queries.length > 0) {
    aggregate.push({$match: {$or: queries}});
  }

  if(sort === "Damage"){
    aggregate.push({$sort: {'Combo.Damage': -1}})
  } else if(sort === "Hits") {
    aggregate.push({$sort: {'Combo.Hits': -1}})
  } else {
    aggregate.push({$sort: {'_id': -1}})
  }
  
  if(filter){
    if (filter === 'Combo'){
      aggregate.push({$match: {ContentType:'Combo'}})
    } else if (filter === 'Match'){
      aggregate.push({$match: {ContentType: 'Match'}})
    }
  }
  if(tagFilter){
    aggregate.push({$match: {"Combo.Tags": { '$elemMatch': { '_id':  ObjectId(tagFilter) } }}});
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

// Fetch all Tag
function getVideos(req, res) {
  var skip =  parseInt(req.query.skip);
  var aggregate = [
    {'$sort': {'_id': -1}},
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
  aggregate.push({$limit: 5});  
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
  var ComboId =  ObjectId(req.params.id);

  var aggregate = [
    {
      '$unwind': {
        'path': '$Combos', 
        'preserveNullAndEmptyArrays': true
      }
    },
    {
      '$match': {
          'Combos.Id': ComboId
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
    {
      '$addFields': {
        'Combo.StartTime': '$Combos.StartTime', 
        'Combo.EndTime': '$Combos.Endtime', 
      }
    }
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
  var matchUrl =  req.params.url;

  var aggregate = [
    {
      '$match': {
          'Url': matchUrl
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

// Query Videos
function getMatchupVideos(req, res) {
  var queries = [];

  var skip =  parseInt(req.query.skip);
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
  var character1 = ObjectId(req.query.character1);
  var character2 = ObjectId(req.query.character2);
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
  
  Video.aggregate(aggregate, function (error, videos) {
    if (error) { console.error(error); }
    res.send({
      videos: videos
    })
  })
}
module.exports = { addVideo, queryVideo, getVideo, patchVideo, deleteVideo, getVideos, getComboVideo, getMatchVideo, getMatchupVideos}