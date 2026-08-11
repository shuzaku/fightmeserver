// Player-centric view over the raw bracket data (Tournaments, tournament-entrants,
// tournament-sets) ingested by MicroServices/tournament-ingestion-service — used by
// the player page's "History" tab to show which tournaments a player has attended
// and how each of their sets went, distinct from the curated video-clip feed.
var Tournament = require("../models/tournaments");
var TournamentEntrant = require("../models/tournament-entrants");
var TournamentSet = require("../models/tournament-sets");
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

// Same field set/populate used by tournament-detail.vue's results endpoint, so
// tournament cards on the history tab render identically (name, image, tier,
// game logo, bracket link, etc.).
var TOURNAMENT_FIELDS = 'Name Games GameId Image LogoUrl EventDate EndDate Location Tier StartggSlug BracketUrl';
var GAME_POPULATE_FIELDS = 'Title Abbreviation LogoUrl';
var GAME_POPULATE = [
    { path: 'Games', select: GAME_POPULATE_FIELDS },
    { path: 'GameId', select: GAME_POPULATE_FIELDS },
];

// Every game a tournament document is associated with — the curated `Games`
// array (falling back to `GameId`, the single-game field auto-ingestion
// sets) — same "combine both fields" logic as tournaments-service.js's
// searchTournaments/getTournamentResults.
function gamesForTournament(t) {
    var list = (t.Games || []).filter((g) => g && typeof g === 'object');
    if (list.length === 0 && t.GameId && typeof t.GameId === 'object') {
        list.push(t.GameId);
    }
    return list;
}

function seasonYearForTournament(t) {
    var date = t.EndDate || t.EventDate;
    return date ? new Date(date).getFullYear() : null;
}

// A player's tournament attendance + match history, paginated by tournament
// (most recently attended first), optionally filtered to one calendar year
// and/or one game. For each tournament attended, includes the player's
// placement/seed and every set they played, grouped by round, with the
// opponent and win/loss resolved from the raw bracket data. Also returns the
// full set of years/games available across the player's ENTIRE history (not
// just the current filter/page) so the UI can populate its filter dropdowns.
async function getPlayerTournamentHistory(playerId, options) {
    options = options || {};
    var page = Math.max(1, parseInt(options.page, 10) || 1);
    var limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
    var skip = (page - 1) * limit;
    var yearFilter = options.year != null && options.year !== '' ? parseInt(options.year, 10) : null;
    if (yearFilter != null && isNaN(yearFilter)) yearFilter = null;

    var emptyResult = { tournaments: [], total: 0, page: page, pageSize: limit, totalPages: 1, filters: { years: [], games: [] } };

    var playerIdObj;
    var gameIdObj;
    try {
        playerIdObj = toObjectId(playerId, 'playerId');
        gameIdObj = options.gameId ? toObjectId(options.gameId, 'gameId') : null;
    } catch (e) {
        throw e;
    }
    if (!playerIdObj) return emptyResult;

    // One entrant row per tournament this player is linked to (via the
    // ingestion pipeline's name/slug matcher — see tournament-entrants.MatchMethod).
    var entrants = await TournamentEntrant.find({ PlayerId: playerIdObj })
        .select('TournamentId RawName Seed FinalPlacement')
        .lean();

    if (!entrants.length) return emptyResult;

    var entrantByTournamentId = {};
    var tournamentIds = [];
    entrants.forEach(function (ent) {
        var key = String(ent.TournamentId);
        // A player should only have one entrant row per tournament; if
        // duplicates ever exist, keep the first and ignore the rest.
        if (!entrantByTournamentId[key]) {
            entrantByTournamentId[key] = ent;
            tournamentIds.push(ent.TournamentId);
        }
    });

    // Fetch every tournament this player has ever attended in one go — used
    // both to build the filter dropdown options (unfiltered) and, filtered
    // in-memory below, the actual page of results. Per-player attendance
    // counts are small (dozens, not thousands), so this is cheaper than a
    // second round-trip to Mongo just to recompute facets separately.
    var allTournaments = await Tournament.find({ _id: { $in: tournamentIds } }, TOURNAMENT_FIELDS)
        .populate(GAME_POPULATE)
        .lean();

    var yearsSet = new Set();
    var gamesById = {};
    allTournaments.forEach(function (t) {
        var year = seasonYearForTournament(t);
        if (year) yearsSet.add(year);
        gamesForTournament(t).forEach(function (g) {
            gamesById[String(g._id)] = { id: g._id, title: g.Title };
        });
    });
    var years = Array.from(yearsSet).sort(function (a, b) { return b - a; });
    var games = Object.values(gamesById).sort(function (a, b) {
        return String(a.title || '').localeCompare(String(b.title || ''));
    });
    var filters = { years: years, games: games };

    var filtered = allTournaments.filter(function (t) {
        if (yearFilter != null && seasonYearForTournament(t) !== yearFilter) return false;
        if (gameIdObj) {
            var matchesGame = gamesForTournament(t).some(function (g) { return String(g._id) === String(gameIdObj); });
            if (!matchesGame) return false;
        }
        return true;
    });

    filtered.sort(function (a, b) {
        var da = a.EndDate || a.EventDate || 0;
        var db = b.EndDate || b.EventDate || 0;
        return new Date(db) - new Date(da);
    });

    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / limit));
    var tournaments = filtered.slice(skip, skip + limit);

    if (!tournaments.length) {
        return { tournaments: [], total: total, page: page, pageSize: limit, totalPages: totalPages, filters: filters };
    }

    var pageEntrantIds = tournaments.map(function (t) {
        return entrantByTournamentId[String(t._id)]._id;
    });
    var pageTournamentIds = tournaments.map(function (t) { return t._id; });

    var sets = await TournamentSet.find({
        TournamentId: { $in: pageTournamentIds },
        $or: [
            { Entrant1Id: { $in: pageEntrantIds } },
            { Entrant2Id: { $in: pageEntrantIds } },
        ],
    })
        .sort({ CompletedAt: 1 })
        .populate({
            path: 'Entrant1Id',
            select: 'RawName PlayerId',
            populate: { path: 'PlayerId', select: 'Name Slug' },
        })
        .populate({
            path: 'Entrant2Id',
            select: 'RawName PlayerId',
            populate: { path: 'PlayerId', select: 'Name Slug' },
        })
        .populate('WinnerEntrantId', 'RawName')
        .lean();

    var setsByTournamentId = {};
    sets.forEach(function (set) {
        var key = String(set.TournamentId);
        if (!setsByTournamentId[key]) setsByTournamentId[key] = [];
        setsByTournamentId[key].push(set);
    });

    var result = tournaments.map(function (tournament) {
        var entrant = entrantByTournamentId[String(tournament._id)];
        var entrantIdStr = String(entrant._id);
        var tournamentSets = setsByTournamentId[String(tournament._id)] || [];

        var roundsOrder = [];
        var roundsByKey = {};
        tournamentSets.forEach(function (set) {
            var isEntrant1 = set.Entrant1Id && String(set.Entrant1Id._id) === entrantIdStr;
            var isEntrant2 = set.Entrant2Id && String(set.Entrant2Id._id) === entrantIdStr;
            if (!isEntrant1 && !isEntrant2) return; // shouldn't happen given the $or filter above

            var opponentEntrant = isEntrant1 ? set.Entrant2Id : set.Entrant1Id;
            var entrantScore = isEntrant1 ? set.Entrant1Score : set.Entrant2Score;
            var opponentScore = isEntrant1 ? set.Entrant2Score : set.Entrant1Score;

            var setResult;
            if (!set.WinnerEntrantId) {
                setResult = 'pending';
            } else if (String(set.WinnerEntrantId._id) === entrantIdStr) {
                setResult = 'win';
            } else {
                setResult = 'loss';
            }

            var phase = set.PhaseName || 'Bracket';
            var round = set.RoundText || 'Round';
            var key = phase + ' — ' + round;
            if (!roundsByKey[key]) {
                roundsByKey[key] = { phaseName: phase, roundText: round, sets: [] };
                roundsOrder.push(key);
            }
            roundsByKey[key].sets.push({
                _id: set._id,
                completedAt: set.CompletedAt,
                result: setResult,
                entrantScore: entrantScore,
                opponentScore: opponentScore,
                opponent: opponentEntrant ? {
                    rawName: opponentEntrant.RawName,
                    playerId: opponentEntrant.PlayerId ? opponentEntrant.PlayerId._id : null,
                    name: opponentEntrant.PlayerId ? opponentEntrant.PlayerId.Name : null,
                    slug: opponentEntrant.PlayerId ? opponentEntrant.PlayerId.Slug : null,
                } : null,
            });
        });

        return {
            tournament: tournament,
            entrant: {
                id: entrant._id,
                rawName: entrant.RawName,
                seed: entrant.Seed,
                finalPlacement: entrant.FinalPlacement,
            },
            rounds: roundsOrder.map(function (key) { return roundsByKey[key]; }),
        };
    });

    return {
        tournaments: result,
        total: total,
        page: page,
        pageSize: limit,
        totalPages: totalPages,
        filters: filters,
    };
}

module.exports = { getPlayerTournamentHistory };
