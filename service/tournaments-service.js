var Tournament = require("../models/tournaments");
var ObjectId = require('mongodb').ObjectId;

function toObjectId(val, fieldLabel) {
    if (val == null || val === '') return undefined;
    if (typeof val === 'object' && val.$oid) {
        val = val.$oid;
    }
    var s = typeof val === 'string' ? val.trim() : String(val);
    if (!ObjectId.isValid(s)) {
        throw new Error('Invalid ObjectId' + (fieldLabel ? ' for ' + fieldLabel : '') + ': ' + s);
    }
    return new ObjectId(s);
}

function normalizeGames(games) {
    if (!games || !Array.isArray(games)) return [];
    return games.map(function (g, i) {
        if (g == null) return null;
        if (typeof g === 'object' && g.$oid) {
            return toObjectId(g.$oid, 'Games[' + i + ']');
        }
        if (typeof g === 'object' && g._id) {
            return toObjectId(g._id, 'Games[' + i + ']');
        }
        return toObjectId(g, 'Games[' + i + ']');
    }).filter(Boolean);
}

function normalizeBracketFilters(raw) {
    if (!raw) return [];
    if (!Array.isArray(raw)) return [];
    return raw
        .map(function (s) {
            return s == null ? '' : String(s).trim();
        })
        .filter(Boolean);
}

// Add new tournament
function addTournament(tournamentData) {
    return new Promise(function (resolve, reject) {
        try {
            var seriesRaw = tournamentData.Series != null ? tournamentData.Series : tournamentData.TournamentSeries;
            var doc = {
                Name: tournamentData.Name,
                Games: normalizeGames(tournamentData.Games),
                Image: tournamentData.Image != null ? tournamentData.Image : tournamentData.LogoUrl,
                EventDate: tournamentData.EventDate ? new Date(tournamentData.EventDate) : undefined,
                Location: tournamentData.Location,
                BracketUrl: tournamentData.BracketUrl,
                BracketFilters: normalizeBracketFilters(tournamentData.BracketFilters),
                Tier: tournamentData.Tier != null && tournamentData.Tier !== '' ? Number(tournamentData.Tier) : undefined,
                IsFinished: tournamentData.IsFinished === true || tournamentData.IsFinished === 'true'
            };

            if (tournamentData.LogoUrl && !doc.Image) {
                doc.LogoUrl = tournamentData.LogoUrl;
            }

            var sid = seriesRaw != null && seriesRaw !== '' ? toObjectId(seriesRaw, 'Series') : undefined;
            if (sid) {
                doc.Series = sid;
            }

            var new_tournament = new Tournament(doc);

            new_tournament.save(function (error, tournament) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Post saved successfully!',
                        tournamentId: tournament.id,
                        tournament: tournament.toObject()
                    });
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

var TOURNAMENT_FIELDS = 'Name Games Image EventDate Series Location BracketUrl IsFinished BracketFilters Tier';

// Fetch all tournaments
function getTournaments() {
    return new Promise((resolve, reject) => {
        Tournament.find({}, TOURNAMENT_FIELDS, function (error, tournaments) {
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
        Tournament.find({IsFinished: true}, TOURNAMENT_FIELDS, function (error, tournaments) {
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
        Tournament.findById(tournamentId, TOURNAMENT_FIELDS, function (error, tournament) {
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
        Tournament.findById(tournamentId, TOURNAMENT_FIELDS + ' LogoUrl', function (error, tournament) {
            if (error) {
                reject(error);
                return;
            }
            if (!tournament) {
                reject(new Error('Tournament not found'));
                return;
            }

            function assignIfDefined(key, value) {
                if (value !== undefined) {
                    tournament[key] = value;
                }
            }

            assignIfDefined('Name', tournamentData.Name);
            if (tournamentData.Games != null) {
                try {
                    tournament.Games = normalizeGames(tournamentData.Games);
                } catch (e) {
                    reject(e);
                    return;
                }
            }
            if (tournamentData.Image != null) tournament.Image = tournamentData.Image;
            if (tournamentData.LogoUrl != null) tournament.LogoUrl = tournamentData.LogoUrl;
            if (tournamentData.EventDate != null) tournament.EventDate = new Date(tournamentData.EventDate);
            if (tournamentData.Location != null) tournament.Location = tournamentData.Location;
            if (tournamentData.BracketUrl != null) tournament.BracketUrl = tournamentData.BracketUrl;
            if (tournamentData.BracketFilters != null) {
                tournament.BracketFilters = normalizeBracketFilters(tournamentData.BracketFilters);
            }
            if (tournamentData.Tier != null && tournamentData.Tier !== '') {
                tournament.Tier = Number(tournamentData.Tier);
            }
            if (tournamentData.IsFinished !== undefined) {
                tournament.IsFinished = tournamentData.IsFinished === true || tournamentData.IsFinished === 'true';
            }

            var seriesRaw = tournamentData.Series != null ? tournamentData.Series : tournamentData.TournamentSeries;
            if (seriesRaw !== undefined && seriesRaw !== null && seriesRaw !== '') {
                try {
                    tournament.Series = toObjectId(seriesRaw, 'Series');
                } catch (e) {
                    reject(e);
                    return;
                }
            }

            tournament.save(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        tournament: tournament.toObject()
                    });
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
                query = {'_id': ObjectId(values[i])};
                queries.push(query);
            } else if (values[i].toLowerCase() === "true" || values[i].toLowerCase() === "false") {
                query[names[i]] = values[i].toLowerCase() === "true" ? true : false;
                queries.push(query);
            } else {
                query[names[i]] = values[i];
                queries.push(query);
            }
        }

        function runFind(q) {
            Tournament.find(q, TOURNAMENT_FIELDS, function (error, tournaments) {
                if (error) {
                    reject(error);
                } else {
                    resolve({tournaments: tournaments});
                }
            }).sort(sortParameter);
        }

        if (queries.length > 1) {
            runFind({$or: queries});
        } else {
            runFind(queries[0]);
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
