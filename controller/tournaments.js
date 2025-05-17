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
  var BracketUrl = req.body.BracketUrl;
  var BracketFilters = req.body.BracketFilters;

  var new_tournament = new Tournament({
    Name: Name,
    Games: Games,
    Image: Image,
    EventDate: EventDate,
    TournamentSeries: TournamentSeries,
    Location: Location,
    BracketUrl: BracketUrl,
    BracketFilters: BracketFilters
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
  Tournament.find({}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
    if (error) { console.error(error); }
    res.send({
      tournaments: tournaments
    })
  }).sort({ EventDate: 1 })
}

// Fetch completed tournaments
function getCompletedTournaments(req, res) {
  const today = new Date();
  Tournament.find({ IsFinished: true}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
    if (error) { console.error(error); }
    res.send({
      tournaments: tournaments
    })
  }).sort({ EventDate: 1 })
}

// Fetch all tournament
function getTournamentSeries(req, res) {
  TournamentSeries.find({}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished', function (error, series) {
    if (error) { console.error(error); }
    res.send({
      series: series
    })
  }).sort({ _id: -1 })
}

// Fetch single tournament
function getTournament(req, res) {
  var db = req.db;
  Tournament.findById(req.params.id, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournament) {
    if (error) { console.error(error); }
    res.send(tournament)
  })
}

// Update a tournament
function updateTournament(req, res) {
  var db = req.db;
  Tournament.findById(req.params.id, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournament) {
    if (error) { console.error(error); }

    tournament.Name = req.body.Name;
    tournament.Games = req.body.Games;
    tournament.Image = req.body.Image;
    tournament.EventDate = req.body.EventDate;
    tournament.TournamentSeries = req.body.TournamentSeries;
    tournament.Location = req.body.Location;
    tournament.BracketUrl = req.body.BracketUrl;

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

// Query Player
function queryTournament(req, res) {
  var db = req.db;
  var names = req.query.queryName.split(",");
  var values = req.query.queryValue.split(",");
  var sort = req.query.sort || 'EventDate';
  var queries = [];
  var sortParameter = {};

  var sortProperty = sort.split(' ')[0] || 'EventDate';
  var sortDirection = sort.split(' ')[1] || 'asc';

  sortParameter[sortProperty] = sortDirection === 'asc' ? 1 : -1;

  for(var i = 0; i < names.length; i++){
    var query = {};
    if(names[i] === ('Id')){
      var query = {'_id':   ObjectId(values[i])};
      queries.push(query);
    }  
    else if(values[i].toLowerCase() === "true" || values[i].toLowerCase() === "false"){
      query[names[i]] = values[i].toLowerCase() === "true"  ? true : false;
      queries.push(query);
    }
    else {
      query[names[i]] = values[i];
      queries.push(query);
    }
  }

  
  if(queries.length > 1) {
    Tournament.find({ $or: queries }, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
      if (error) { console.error(error); }
      res.send({
        tournaments: tournaments
      })
    }).sort(sortParameter)
  }
  else {
    Tournament.find(queries[0], 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
      if (error) { console.error(error); }

      res.send({
        tournaments: tournaments
      })
    }).sort(sortParameter)  
  }
};

module.exports = { addTournament, getTournaments, getTournament, updateTournament, deleteTournament, getTournamentSeries,getCompletedTournaments, queryTournament}