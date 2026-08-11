var SeasonPowerRanking = require("../models/season-power-rankings");
var ObjectId = require('mongodb').ObjectId;

function safeObjectId(value) {
    if (!value || value === 'null' || value === 'undefined' || value === '') {
        return null;
    }
    try {
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            return ObjectId(value);
        }
        return null;
    } catch (e) {
        return null;
    }
}

function safeSeason(value) {
    var year = parseInt(value, 10);
    if (!year || year < 2000 || year > 2100) return null;
    return year;
}

// Leaderboard for one game's one calendar-year season — the PGR/LumiRank-style
// power ranking computed by MicroServices/ranking-service's `npm run season`.
// Sorted by Rank ascending (Rank 1 = best season), which already reflects the
// #1=100/#50=50 rescale — see that service's src/season-power-ranking-engine.js.
function getSeasonLeaderboard(gameId, season, options) {
    return new Promise((resolve, reject) => {
        var gameIdObj = safeObjectId(gameId);
        var seasonYear = safeSeason(season);
        if (!gameIdObj || !seasonYear) {
            resolve({ rankings: [], total: 0, season: seasonYear });
            return;
        }

        var limit = Math.min(parseInt((options && options.limit) || 50, 10) || 50, 100);
        var page = Math.max(parseInt((options && options.page) || 1, 10) || 1, 1);
        var skip = (page - 1) * limit;

        Promise.all([
            SeasonPowerRanking.find({ GameId: gameIdObj, Season: seasonYear })
                .sort({ Rank: 1 })
                .skip(skip)
                .limit(limit)
                .populate('PlayerId', 'Name ImageUrl Slug')
                .lean(),
            SeasonPowerRanking.countDocuments({ GameId: gameIdObj, Season: seasonYear }),
        ])
            .then(([rankings, total]) => {
                resolve({ rankings: rankings, total: total, season: seasonYear });
            })
            .catch(reject);
    });
}

// Distinct seasons computed for a game so the UI can populate a year
// selector without hardcoding — most recent first.
function getAvailableSeasons(gameId) {
    return new Promise((resolve, reject) => {
        var gameIdObj = safeObjectId(gameId);
        if (!gameIdObj) {
            resolve([]);
            return;
        }

        SeasonPowerRanking.distinct('Season', { GameId: gameIdObj })
            .then(seasons => {
                resolve(seasons.sort((a, b) => b - a));
            })
            .catch(reject);
    });
}

// A single player's season ranking for one game+year (used by player pages).
function getPlayerSeasonRanking(playerId, gameId, season) {
    return new Promise((resolve, reject) => {
        var playerIdObj = safeObjectId(playerId);
        var gameIdObj = safeObjectId(gameId);
        var seasonYear = safeSeason(season);
        if (!playerIdObj || !gameIdObj || !seasonYear) {
            resolve(null);
            return;
        }

        SeasonPowerRanking.findOne({ PlayerId: playerIdObj, GameId: gameIdObj, Season: seasonYear })
            .lean()
            .then(resolve)
            .catch(reject);
    });
}

module.exports = { getSeasonLeaderboard, getAvailableSeasons, getPlayerSeasonRanking };
