var tournamentService = require("../service/tournaments-service");

// Add new tournament
function addTournament(req, res) {
    tournamentService.addTournament(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            var msg = error.message || 'Error saving tournament';
            var status = /Invalid ObjectId|Invalid|M missing|required/i.test(msg) ? 400 : 500;
            res.status(status).send({
                success: false,
                message: 'Error saving tournament',
                error: msg
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

// Search tournaments (game/tier/date-range/location/name filters, paginated)
function searchTournaments(req, res) {
    tournamentService.searchTournaments(req.query)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            var msg = error.message || 'Error searching tournaments';
            var status = /Invalid ObjectId/i.test(msg) ? 400 : 500;
            res.status(status).send({
                success: false,
                message: 'Error searching tournaments',
                error: msg
            });
        });
}

// Fetch a tournament's results: top standings + round-grouped match list
function getTournamentResults(req, res) {
    tournamentService.getTournamentResults(req.params.id, req.query)
        .then(result => {
            if (!result) {
                res.status(404).send({
                    success: false,
                    message: 'Tournament not found'
                });
                return;
            }
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            var msg = error.message || 'Error fetching tournament results';
            var status = /Invalid ObjectId/i.test(msg) ? 400 : 500;
            res.status(status).send({
                success: false,
                message: 'Error fetching tournament results',
                error: msg
            });
        });
}

module.exports = { addTournament, getTournaments, getTournament, updateTournament, deleteTournament, getTournamentSeries,getCompletedTournaments, queryTournament, searchTournaments, getTournamentResults}