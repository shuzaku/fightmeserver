var Tournament = require("../models/tournaments");
var ObjectId = require('mongodb').ObjectId;

// Add new tournament
function addTournament(tournamentData) {
    return new Promise((resolve, reject) => {
        var new_tournament = new Tournament({
            Name: tournamentData.Name,
            Games: tournamentData.Games,
            Image: tournamentData.Image,
            EventDate: tournamentData.EventDate,
            TournamentSeries: tournamentData.TournamentSeries,
            Location: tournamentData.Location,
            BracketUrl: tournamentData.BracketUrl,
            BracketFilters: tournamentData.BracketFilters
        });

        new_tournament.save(function (error, tournament) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Post saved successfully!',
                    tournamentId: tournament.id
                });
            }
        });
    });
}

// Fetch all tournaments
function getTournaments() {
    return new Promise((resolve, reject) => {
        Tournament.find({}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
            if (error) {
                reject(error);
            } else {
                resolve({tournaments: tournaments});
            }
        }).sort({EventDate: 1});
    });
}

// Fetch completed tournaments
function getCompletedTournaments() {
    return new Promise((resolve, reject) => {
        const today = new Date();
        Tournament.find({IsFinished: true}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
            if (error) {
                reject(error);
            } else {
                resolve({tournaments: tournaments});
            }
        }).sort({EventDate: 1});
    });
}

// Fetch single tournament
function getTournament(tournamentId) {
    return new Promise((resolve, reject) => {
        Tournament.findById(tournamentId, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournament) {
            if (error) {
                reject(error);
            } else {
                resolve(tournament);
            }
        });
    });
}

// Update a tournament
function updateTournament(tournamentId, tournamentData) {
    return new Promise((resolve, reject) => {
        Tournament.findById(tournamentId, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournament) {
            if (error) {
                reject(error);
                return;
            }

            tournament.Name = tournamentData.Name;
            tournament.Games = tournamentData.Games;
            tournament.Image = tournamentData.Image;
            tournament.EventDate = tournamentData.EventDate;
            tournament.TournamentSeries = tournamentData.TournamentSeries;
            tournament.Location = tournamentData.Location;
            tournament.BracketUrl = tournamentData.BracketUrl;

            tournament.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({success: true});
                }
            });
        });
    });
}

// Delete a tournament
function deleteTournament(tournamentId) {
    return new Promise((resolve, reject) => {
        Tournament.remove({
            _id: tournamentId
        }, function (err, tournament) {
            if (err) {
                reject(err);
            } else {
                resolve({success: true});
            }
        });
    });
}

// Query Tournament
function queryTournament(queryParams) {
    return new Promise((resolve, reject) => {
        var names = queryParams.queryName.split(",");
        var values = queryParams.queryValue.split(",");
        var sort = queryParams.sort || 'EventDate';
        var queries = [];
        var sortParameter = {};

        var sortProperty = sort.split(' ')[0] || 'EventDate';
        var sortDirection = sort.split(' ')[1] || 'asc';

        sortParameter[sortProperty] = sortDirection === 'asc' ? 1 : -1;

        for (var i = 0; i < names.length; i++) {
            var query = {};
            if (names[i] === ('Id')) {
                var query = {'_id': ObjectId(values[i])};
                queries.push(query);
            } else if (values[i].toLowerCase() === "true" || values[i].toLowerCase() === "false") {
                query[names[i]] = values[i].toLowerCase() === "true" ? true : false;
                queries.push(query);
            } else {
                query[names[i]] = values[i];
                queries.push(query);
            }
        }

        if (queries.length > 1) {
            Tournament.find({$or: queries}, 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
                if (error) {
                    reject(error);
                } else {
                    resolve({tournaments: tournaments});
                }
            }).sort(sortParameter);
        } else {
            Tournament.find(queries[0], 'Name Games Image EventDate TournamentSeries Location BracketUrl IsFinished BracketFilters', function (error, tournaments) {
                if (error) {
                    reject(error);
                } else {
                    resolve({tournaments: tournaments});
                }
            }).sort(sortParameter);
        }
    });
}

module.exports = {
    addTournament,
    getTournaments,
    getTournament,
    updateTournament,
    deleteTournament,
    getCompletedTournaments,
    queryTournament
};
