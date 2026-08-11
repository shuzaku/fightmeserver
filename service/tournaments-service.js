var Tournament = require("../models/tournaments");
var TournamentEntrant = require("../models/tournament-entrants");
var TournamentSet = require("../models/tournament-sets");
var TournamentStanding = require("../models/tournament-standings");
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

// StartggSlug lets the UI build a bracket link for auto-ingested tournaments,
// which set it instead of BracketUrl.
var TOURNAMENT_FIELDS = 'Name Games Image EventDate Series Location BracketUrl IsFinished BracketFilters Tier StartggSlug';

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

// StartggSlug is projected so the UI can build a bracket link for auto-ingested
// tournaments — those set it instead of BracketUrl, which only manually-entered
// tournaments carry.
var SEARCH_FIELDS = 'Name Games GameId Image LogoUrl EventDate EndDate Location Series Tier IsFinished BracketUrl Tier EntrantCount SyncStatus LiquipediaUrl StartggSlug';
var GAME_POPULATE_FIELDS = 'Title Abbreviation LogoUrl';
var GAME_POPULATE = [
    { path: 'Games', select: GAME_POPULATE_FIELDS },
    // Auto-ingested tournaments (see MicroServices/tournament-ingestion-service)
    // are single-game and set this instead of (or alongside) Games — the
    // Games array is only reliably populated once the pipeline's retroactive
    // backfill has run, so this is the field the UI should fall back to.
    { path: 'GameId', select: GAME_POPULATE_FIELDS },
];

// Search tournaments with real filters (game, tier, date range, location, name, finished state)
function searchTournaments(queryParams) {
    queryParams = queryParams || {};
    return new Promise((resolve, reject) => {
        try {
            var filter = {};

            if (queryParams.game) {
                var gameIds = String(queryParams.game).split(',').map(function (g) {
                    return toObjectId(g.trim(), 'game');
                });
                // Match either the curated Games array (manually-entered / backfilled
                // tournaments) or the single GameId set by the auto-ingestion pipeline —
                // most ingested tournaments only reliably have the latter until the
                // Games array backfill has been run (see backfill-game-id.js --fix-games).
                filter.$or = [
                    { Games: gameIds.length > 1 ? { $in: gameIds } : gameIds[0] },
                    { GameId: gameIds.length > 1 ? { $in: gameIds } : gameIds[0] },
                ];
            }

            if (queryParams.tier) {
                var tiers = String(queryParams.tier).split(',').map(function (t) {
                    return Number(t);
                }).filter(function (t) { return !isNaN(t); });
                if (tiers.length) {
                    filter.Tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
                }
            }

            if (queryParams.location) {
                filter.Location = { $regex: String(queryParams.location).trim(), $options: 'i' };
            }

            if (queryParams.search) {
                filter.Name = { $regex: String(queryParams.search).trim(), $options: 'i' };
            }

            if (queryParams.isFinished !== undefined && queryParams.isFinished !== '') {
                filter.IsFinished = queryParams.isFinished === true || queryParams.isFinished === 'true';
            }

            var dateFrom = queryParams.dateFrom ? new Date(queryParams.dateFrom) : null;
            var dateTo = queryParams.dateTo ? new Date(queryParams.dateTo) : null;
            if ((dateFrom && !isNaN(dateFrom)) || (dateTo && !isNaN(dateTo))) {
                filter.EventDate = {};
                if (dateFrom && !isNaN(dateFrom)) filter.EventDate.$gte = dateFrom;
                if (dateTo && !isNaN(dateTo)) filter.EventDate.$lte = dateTo;
            }

            var page = Math.max(1, parseInt(queryParams.page, 10) || 1);
            var limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
            var skip = (page - 1) * limit;

            var sort = queryParams.sort || 'EventDate';
            var sortProperty = sort.split(' ')[0] || 'EventDate';
            var sortDirection = sort.split(' ')[1] === 'desc' ? -1 : (sort.split(' ')[1] === 'asc' ? 1 : (sortProperty === 'EventDate' ? -1 : 1));
            var sortParameter = {};
            sortParameter[sortProperty] = sortDirection;

            Tournament.countDocuments(filter, function (countErr, total) {
                if (countErr) {
                    reject(countErr);
                    return;
                }

                Tournament.find(filter, SEARCH_FIELDS)
                    .populate(GAME_POPULATE)
                    .sort(sortParameter)
                    .skip(skip)
                    .limit(limit)
                    .exec(function (error, tournaments) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({
                                tournaments: tournaments,
                                total: total,
                                page: page,
                                pageSize: limit,
                                totalPages: Math.max(1, Math.ceil(total / limit))
                            });
                        }
                    });
            });
        } catch (e) {
            reject(e);
        }
    });
}

// Fetch a tournament's results: top standings and sets grouped by round, for the
// detail page's "top players" + "round-grouped match list" bracket view.
function getTournamentResults(tournamentId, options) {
    options = options || {};
    var topN = Math.min(64, Math.max(1, parseInt(options.topN, 10) || 8));

    return new Promise((resolve, reject) => {
        var tId;
        try {
            tId = toObjectId(tournamentId, 'tournamentId');
        } catch (e) {
            reject(e);
            return;
        }

        Tournament.findById(tId, SEARCH_FIELDS)
            .populate(GAME_POPULATE)
            .exec(function (tErr, tournament) {
                if (tErr) {
                    reject(tErr);
                    return;
                }
                if (!tournament) {
                    resolve(null);
                    return;
                }

                TournamentStanding.find({ TournamentId: tId })
                    .sort({ Placement: 1 })
                    .limit(topN)
                    .populate('PlayerId', 'Name ImageUrl Slug')
                    .populate('EntrantId', 'RawName Seed')
                    .exec(function (sErr, standings) {
                        if (sErr) {
                            reject(sErr);
                            return;
                        }

                        TournamentSet.find({ TournamentId: tId })
                            .sort({ CompletedAt: 1 })
                            // Nested-populate the matched player so bracket
                            // entrants can link to their player page, the same
                            // way standings already do. PlayerId is null for
                            // entrants the ingestion matcher couldn't resolve.
                            .populate({
                                path: 'Entrant1Id',
                                select: 'RawName PlayerId',
                                populate: { path: 'PlayerId', select: 'Name Slug' }
                            })
                            .populate({
                                path: 'Entrant2Id',
                                select: 'RawName PlayerId',
                                populate: { path: 'PlayerId', select: 'Name Slug' }
                            })
                            .populate('WinnerEntrantId', 'RawName')
                            .exec(function (setErr, sets) {
                                if (setErr) {
                                    reject(setErr);
                                    return;
                                }

                                var roundsOrder = [];
                                var roundsByKey = {};
                                sets.forEach(function (set) {
                                    var phase = set.PhaseName || 'Bracket';
                                    var round = set.RoundText || 'Round';
                                    var key = phase + ' — ' + round;
                                    if (!roundsByKey[key]) {
                                        roundsByKey[key] = { phaseName: phase, roundText: round, sets: [] };
                                        roundsOrder.push(key);
                                    }
                                    roundsByKey[key].sets.push(set);
                                });

                                resolve({
                                    tournament: tournament,
                                    topStandings: standings,
                                    rounds: roundsOrder.map(function (key) { return roundsByKey[key]; })
                                });
                            });
                    });
            });
    });
}

module.exports = {
    addTournament,
    getTournaments,
    getTournament,
    updateTournament,
    deleteTournament,
    getCompletedTournaments,
    queryTournament,
    searchTournaments,
    getTournamentResults
};
