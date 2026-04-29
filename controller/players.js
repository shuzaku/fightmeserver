<<<<<<< HEAD
var Player = require("../models/players");
var ObjectId = require('mongodb').ObjectId;
var MatchService = require("../service/matches-service");
var Match = require("../models/matches");
var playerAccountLink = require("../service/player-account-link-service");


// Add new player
function addPlayer(req, res) {
  var db = req.db;
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

// Fetch all players
function getPlayers(req, res) {
  Player.find({}, 'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube', function (error, players) {
    if (error) { console.error(error); }
    res.send({
      players: players
    })
  }).sort({ _id: -1 })
}

// Fetch single player
function getPlayer(req, res) {
  var db = req.db;
  Player.findById(
    req.params.id,
    'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube AccountId',
    function (error, player) {
      if (error) { console.error(error); }
      res.send(player);
    }
  );
}

// Update a player
function updatePlayer(req, res) {
  var db = req.db;
  Player.findById(req.params.id, function (error, player) {
    if (error) {
      console.error(error);
    }
    if (!player) {
      return res.status(404).send({ message: 'Player not found' });
    }
    if (req.body.Name !== undefined) {
      player.Name = req.body.Name;
    }
    if (req.body.PlayerImg !== undefined) {
      player.PlayerImg = req.body.PlayerImg;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'AccountId')) {
      return player.save(function (e2) {
        if (e2) {
          return res.status(500).send({ message: e2.message || 'Save failed' });
        }
        return playerAccountLink.setLinkByPlayerId(
          String(req.params.id),
          req.body.AccountId,
          function (e3) {
            if (e3) {
              return res.status(400).send({ message: e3.message || 'Link failed' });
            }
            return res.send({ success: true });
          }
        );
      });
    }
    return player.save(function (error2) {
      if (error2) {
        return res.status(500).send({ message: error2.message || 'Save failed' });
      }
      return res.send({
        success: true
      });
    });
  });
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
    }).sort({ Name: 1 })    
  }
  else {
    Player.find(queries[0], 'Name PlayerImg ', function (error, players) {
      if (error) { console.error(error); }

      res.send({
        players: players
      })
    }).sort({ Name: 1 })    
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
  Player.remove({
    _id: req.params.player1Id
  }, function (err) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })  
  res.send('Player Merged');
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
=======
var playerService = require("../service/players-service");

// Add new player
function addPlayer(req, res) {
    const isBulk = req.query.bulk;
    playerService.addPlayer(req.body, isBulk)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving player',
                error: error.message
            });
        });
}

// Fetch all players
function getPlayers(req, res) {
    playerService.getPlayers(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching players',
                error: error.message
            });
        });
}

// Fetch single player
function getPlayer(req, res) {
    playerService.getPlayer(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player',
                error: error.message
            });
        });
}

// Update a player
function updatePlayer(req, res) {
    playerService.updatePlayer(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating player',
                error: error.message
            });
        });
}

// Delete a player
function deletePlayer(req, res) {
    playerService.deletePlayer(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting player',
                error: error.message
            });
        });
}

// Query Player
function queryPlayer(req, res) {
    playerService.queryPlayer(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error querying players',
                error: error.message
            });
        });
};

function getPlayerBySlug(req, res) {
    playerService.getPlayerBySlug(req.params.slug)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching player by slug',
                error: error.message
            });
        });
}

async function mergePlayers(req, res) {
    try {
        const result = await playerService.mergePlayers(req.params.player1Id, req.params.player2Id);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error merging players',
            error: error.message
        });
    }
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
>>>>>>> 77dfb8a4b5c7e383181cf6d0a1722e732150aba0
}