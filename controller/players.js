var Player = require("../models/players");
var ObjectId = require('mongodb').ObjectId;

// Add new player
function addPlayer(req, res) {
  var db = req.db;
  var Name = req.body.Name;
  var ImageUrl = req.body.ImageUrl;

  var new_player = new Player({
    Name: Name,
    ImageUrl: ImageUrl,
  })

  new_player.save(function (error) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!'
    })
  })
}

// Fetch all player
function getPlayers(req, res) {
  Player.aggregate([{$match: {
    _id: {
      $ne: ObjectId("000000000000000000000000")
    }
  }
  }], function (error, players) {
    if (error) { console.error(error); }
    res.send({
      players: players
    })
  }).sort({ _id: -1 })
}

// Fetch single player
function getPlayer(req, res) {
  var db = req.db;
  Player.findById(req.params.id, 'Name ImageUrl', function (error, player) {
    if (error) { console.error(error); }
    res.send(player)
  })
}

// Update a player
function updatePlayer(req, res) {
  var db = req.db;
  Player.findById(req.params.id, 'Name ImageUrl', function (error, player) {
    if (error) { console.error(error); }

    player.Name = req.body.Name;
    player.ImageUrl = req.body.ImageUrl;

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
  var db = req.db;
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

module.exports = {addPlayer, getPlayer, getPlayers, updatePlayer, deletePlayer}