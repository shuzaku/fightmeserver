var PlayerRating = require("../models/player-ratings");
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

// Leaderboard for one game — Glicko-2 ratings computed by
// MicroServices/ranking-service. Sorted by ConservativeRating (Rating minus
// a multiple of RD — see that service's src/config/conservative-rating.js),
// not raw Rating, so a barely-proven player with one big win and a huge RD
// doesn't briefly outrank a well-established one. Raw Rating is still
// returned per row for display.
function getLeaderboard(gameId, options) {
    return new Promise((resolve, reject) => {
        var gameIdObj = safeObjectId(gameId);
        if (!gameIdObj) {
            resolve({ ratings: [], total: 0 });
            return;
        }

        var limit = Math.min(parseInt((options && options.limit) || 50, 10) || 50, 100);
        var page = Math.max(parseInt((options && options.page) || 1, 10) || 1, 1);
        var skip = (page - 1) * limit;

        Promise.all([
            PlayerRating.find({ GameId: gameIdObj })
                .sort({ ConservativeRating: -1 })
                .skip(skip)
                .limit(limit)
                .populate('PlayerId', 'Name ImageUrl Slug')
                .lean(),
            PlayerRating.countDocuments({ GameId: gameIdObj }),
        ])
            .then(([ratings, total]) => {
                resolve({ ratings: ratings, total: total });
            })
            .catch(reject);
    });
}

// A single player's rating for one game (used by player pages).
function getPlayerRating(playerId, gameId) {
    return new Promise((resolve, reject) => {
        var playerIdObj = safeObjectId(playerId);
        var gameIdObj = safeObjectId(gameId);
        if (!playerIdObj || !gameIdObj) {
            resolve(null);
            return;
        }

        PlayerRating.findOne({ PlayerId: playerIdObj, GameId: gameIdObj })
            .lean()
            .then(resolve)
            .catch(reject);
    });
}

module.exports = { getLeaderboard, getPlayerRating };
