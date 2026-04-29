var tournamentService = require("../service/tournaments-service");

// Add new tournament
function addTournament(req, res) {
    tournamentService.addTournament(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving tournament',
                error: error.message
            });
        });
}

// Fetch all tournaments
function getTournaments(req, res) {
    tournamentService.getTournaments()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching tournaments',
                error: error.message
            });
        });
}

// Fetch completed tournaments
function getCompletedTournaments(req, res) {
    tournamentService.getCompletedTournaments()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching completed tournaments',
                error: error.message
            });
        });
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
    tournamentService.getTournament(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching tournament',
                error: error.message
            });
        });
}

// Update a tournament
function updateTournament(req, res) {
    tournamentService.updateTournament(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating tournament',
                error: error.message
            });
        });
}

// Delete a tournament
function deleteTournament(req, res) {
    tournamentService.deleteTournament(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting tournament',
                error: error.message
            });
        });
}

// Query Tournament
function queryTournament(req, res) {
    tournamentService.queryTournament(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error querying tournaments',
                error: error.message
            });
        });
};

module.exports = { addTournament, getTournaments, getTournament, updateTournament, deleteTournament, getTournamentSeries,getCompletedTournaments, queryTournament}