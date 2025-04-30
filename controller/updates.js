var Update = require("../models/updates");

// Add new tournament
function addUpdate(req, res) {
  var db = req.db;
  var Type = req.body.Type;
  var SubType = req.body.SubType;
  var Games = req.body.Games;
  var Note = req.body.Note;
  var Date = req.body.Date;
  var Image = req.body.Image;
  var Link = req.body.Link;

  var new_update = new Update({
    Type: Type,
    SubType: SubType,
    Games: Games,
    Note: Note,
    Date: Date,
    Image: Image,
    Link: Link
  })

  new_update.save(function (error, update) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!',
      updateId: update.id
    })
  })
}

// Fetch all tournament
function getUpdates(req, res) {
  Update.find({}, 'Type SubType Games Note Date Image Link', function (error, updates) {
    if (error) { console.error(error); }
    res.send({
      updates: updates
    })
  }).sort({ _id: -1 })
}

// Fetch single tournament
function getUpdate(req, res) {
  var db = req.db;
  Update.findById(req.params.id, 'Type SubType Games Note Date Image Link', function (error, update) {
    if (error) { console.error(error); }
    res.send(update)
  })
}

// Update a tournament
function updateUpdate(req, res) {
  var db = req.db;
  Tournament.findById(req.params.id, 'Type SubType Games Note Date Image Link', function (error, update) {
    if (error) { console.error(error); }

    tournament.Name = req.body.Name;
    tournament.Games = req.body.Games;
    tournament.Image = req.body.Image;
    tournament.EventDate = req.body.EventDate;
    tournament.TournamentSeries = req.body.TournamentSeries;
    tournament.Location = req.body.Location;

    tournament.save(function (error) {
      if (error) {
        console.log(error)
      }
      res.send({
        success: true
      })
    })
  })
}

// Delete a tournament
function deleteUpdate(req, res) {
  var db = req.db;
  Update.remove({
    _id: req.params.id
  }, function (err, update) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

module.exports = { addUpdate, getUpdates, getUpdate, updateUpdate, deleteUpdate}