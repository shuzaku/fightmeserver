var Tournament = require("../models/tournaments");

// Add new tournament
function addTournament(req, res) {
  var db = req.db;
  var Name = req.body.Name;
  var Games = req.body.Games;
  var Image = req.body.Image;
  var EventDate = req.body.EventDate;
  var TournamentSeries = req.body.TournamentSeries;
  var Location = req.body.Location;

  var new_tournament = new Tournament({
    Name: Name,
    Games: Games,
    Image: Image,
    EventDate: EventDate,
    TournamentSeries: TournamentSeries,
    Location: Location
  })

  new_tournament.save(function (error, tournament) {
    if (error) {
      console.log(error)
    }
    res.send({
      success: true,
      message: 'Post saved successfully!',
      tournamentId: tournament.id
    })
  })
}

// Fetch all tournament
function getTournaments(req, res) {
  Tournament.find({}, 'Name Games Image EventDate TournamentSeries Location', function (error, tournaments) {
    if (error) { console.error(error); }
    res.send({
      tournaments: tournaments
    })
  }).sort({ _id: -1 })
}

// Fetch single tournament
function getTournament(req, res) {
  var db = req.db;
  Tournament.findById(req.params.id, 'Name Games Image EventDate TournamentSeries Location', function (error, tournament) {
    if (error) { console.error(error); }
    res.send(tournament)
  })
}

// Update a tournament
function updateTournament(req, res) {
  var db = req.db;
  Tournament.findById(req.params.id, 'Name Games Image EventDate TournamentSeries Location', function (error, tournament) {
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
function deleteTournament(req, res) {
  var db = req.db;
  Tournament.remove({
    _id: req.params.id
  }, function (err, tournament) {
    if (err)
      res.send(err)
    res.send({
      success: true
    })
  })
}

module.exports = { addTournament, getTournaments, getTournament, updateTournament, deleteTournament}