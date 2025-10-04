var Player = require("../models/players");
var ObjectId = require('mongodb').ObjectId;
var MatchService = require("../service/matches-service");
var Match = require("../models/matches");
var TournamentMatch = require("../models/tournament-matches");
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");

// Add new player
function addPlayer(req, res) {
  if(!req.query.bulk){
  var name = req.body.Name;
  var imageUrl = req.body.ImageUrl;
  var randomNumber = Math.floor(1000 + Math.random() * 9000);
  var formattedName = name.replace(/ /g, '').replace('-','').replace('_','');
  var slug  = `${formattedName.toLowerCase()}-${randomNumber}`;

  var new_player = new Player({
    Name: name,
    ImageUrl: imageUrl,
    Slug: slug
  })

  new_player.save(function (error, player) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!',
      playerId: player.id
    })
  })
}
else {
  Player.insertMany(req.body, function(error){
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Players saved successfully!'
    })      
  })
}
}

// Fetch all players
function getPlayers(req, res) {
  var limit = parseLimit(req, 20, 100);
  var skip = parseSkip(req);
  var sortObj = parseSortWithDirection(req, '_id', -1);
  
  Player.find({}, 'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube', function (error, players) {
    if (error) { console.error(error); }
    res.send({
      players: players
    })
  }).sort(sortObj).skip(skip).limit(limit)
}

// Fetch single player
function getPlayer(req, res) {
  var db = req.db;
  Player.findById(req.params.id, 'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube', function (error, player) {
    if (error) { console.error(error); }
    res.send(player)
  })
}

// Update a player
function updatePlayer(req, res) {
  var db = req.db;
  Player.findById(req.params.id, 'Name PlayerImg', function (error, player) {
    if (error) { console.error(error); }

    player.Name = req.body.Name;
    player.PlayerImg = req.body.PlayerImg;

    player.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a player
function deletePlayer(req, res) {
  Player.remove({
    _id: req.params.id
  }, function (err, player) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

// Query Player
function queryPlayer(req, res) {
  var db = req.db;
  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var queries = [];
  var limit = parseLimit(req, 10, 50);
  var skip = parseSkip(req);
  var sortObj = parseSortWithDirection(req, 'Name', 1);

  for(var i = 0; i < names.length; i++){
    var query = {};
    if(names[i] === ('Id')){
      var query = {'_id':   ObjectId(values[i])};
      queries.push(query);
    }  else {
      query[names[i]] = values[i];
      queries.push(query);
    }
  }
  
  if(queries.length > 1) {
    Player.find({ $or: queries }, 'Name PlayerImg ', function (error, players) {
      if (error) { console.error(error); }
      res.send({
        players: players
      })
    }).sort(sortObj).skip(skip).limit(limit)    
  }
  else {
    Player.find(queries[0], 'Name PlayerImg ', function (error, players) {
      if (error) { console.error(error); }

      res.send({
        players: players
      })
    }).sort(sortObj).skip(skip).limit(limit)    
  }
};

function getPlayerBySlug(req, res) {
  var aggregate = [];
  aggregate.push({$match: { "Slug" : req.params.slug }});

    Player.aggregate(aggregate, function (error, players) {
      if (error) { console.error(error); }
      res.send({
        players: players
      })
    })
}

async function mergePlayers(req, res){
  var player1Id = ObjectId(req.params.player1Id);
  var player2Id = ObjectId(req.params.player2Id);
  var player1Query = {'Team1Players': {$elemMatch: { Id: player1Id}}};
  var player2Query = {'Team2Players': {$elemMatch: { Id: player1Id}}};

  var player1setQuery = {$set:{ 'Team1Players.$[].Id': player2Id } };
  var player2setQuery = {$set:{ 'Team2Players.$[].Id': player2Id } };

  Match.updateMany(player1Query,player1setQuery, function (res,error) {
    if (error) { console.error(error); }
  })
  Match.updateMany(player2Query,player2setQuery, function (res,error) {
    if (error) { console.error(error); }
  })
  TournamentMatch.updateMany(player1Query,player1setQuery, function (res,error) {
    if (error) { console.error(error); }
  })
  TournamentMatch.updateMany(player2Query,player2setQuery, function (res,error) {
    if (error) { console.error(error); }
  })
  Player.deleteOne({
    _id: req.params.player1Id
  }, function (err) {
    if (err){
      res.send(err)
    }
      res.send('Player Merged');
  })  
  
}

module.exports = 
{
  addPlayer, 
  getPlayer, 
  getPlayers, 
  updatePlayer, 
  deletePlayer, 
  queryPlayer, 
  getPlayerBySlug,
  mergePlayers
}