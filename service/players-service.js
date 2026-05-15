var Player = require("../models/players");
var Game = require("../models/games");
var Character = require("../models/characters");
var ObjectId = require('mongodb').ObjectId;
var MatchService = require("./matches-service");
var Match = require("../models/matches");
var TournamentMatch = require("../models/tournament-matches");
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");

// Add new player
function addPlayer(playerData, isBulk = false) {
    return new Promise((resolve, reject) => {
        if (!isBulk) {
            var name = playerData.Name;
            var imageUrl = playerData.ImageUrl;
            var randomNumber = Math.floor(1000 + Math.random() * 9000);
            var formattedName = name.replace(/ /g, '').replace('-', '').replace('_', '');
            var slug = `${formattedName.toLowerCase()}-${randomNumber}`;

            var new_player = new Player({
                Name: name,
                ImageUrl: imageUrl,
                Slug: slug
            });

            new_player.save(function (error, player) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Post saved successfully!',
                        playerId: player.id
                    });
                }
            });
        } else {
            Player.insertMany(playerData, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Players saved successfully!'
                    });
                }
            });
        }
    });
}

// Fetch all players
function getPlayers(queryParams = {}) {
    return new Promise((resolve, reject) => {
        // Create a mock req object for the query utils
        const mockReq = { query: queryParams };
        var limit = parseLimit(mockReq, undefined, 100);
        var skip = parseSkip(mockReq);
        var sortObj = parseSortWithDirection(mockReq, 'MatchupAppearance', -1);

        var query = Player.find({}, 'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube').sort(sortObj).skip(skip);
        if (limit !== undefined) {
            query = query.limit(limit);
        }
        query.exec(function (error, players) {
            if (error) {
                reject(error);
            } else {
                resolve({players: players});
            }
        });
    });
}

/** Derives games and characters played by a player from their match history.
 *  Returns [{ game: { _id, Title, LogoUrl, Abbreviation }, characters: [{ _id, Name, AvatarUrl, ImageUrl, Slug }] }]
 */
async function deriveGamesPlayedFromMatches(playerObjectId) {

    // Aggregate: find all matches for this player, group by game, collect unique character IDs
    var pipeline = [
        {
            $match: {
                $or: [
                    { 'Team1Players': { $elemMatch: { Id: playerObjectId } } },
                    { 'Team2Players': { $elemMatch: { Id: playerObjectId } } }
                ]
            }
        },
        { $sort: { _id: -1 } },
        { $limit: 300 },
        // Determine which team the player is on and get their character IDs
        {
            $project: {
                GameId: 1,
                playerCharIds: {
                    $let: {
                        vars: {
                            team1entry: {
                                $arrayElemAt: [
                                    { $filter: { input: '$Team1Players', as: 'p', cond: { $eq: ['$$p.Id', playerObjectId] } } },
                                    0
                                ]
                            },
                            team2entry: {
                                $arrayElemAt: [
                                    { $filter: { input: '$Team2Players', as: 'p', cond: { $eq: ['$$p.Id', playerObjectId] } } },
                                    0
                                ]
                            }
                        },
                        in: {
                            $ifNull: [
                                '$$team1entry.CharacterIds',
                                { $ifNull: ['$$team2entry.CharacterIds', []] }
                            ]
                        }
                    }
                }
            }
        },
        { $unwind: { path: '$playerCharIds', preserveNullAndEmptyArrays: true } },
        // Group by game, collecting unique character IDs
        {
            $group: {
                _id: '$GameId',
                charIds: { $addToSet: '$playerCharIds' }
            }
        },
        // Remove any null entries from charIds (from matches with no characters)
        {
            $project: {
                charIds: {
                    $filter: { input: '$charIds', as: 'c', cond: { $ne: ['$$c', null] } }
                }
            }
        },
        // Populate game documents
        {
            $lookup: {
                from: 'games',
                localField: '_id',
                foreignField: '_id',
                as: 'gameDoc'
            }
        },
        { $unwind: { path: '$gameDoc', preserveNullAndEmptyArrays: true } },
        // Populate character documents
        {
            $lookup: {
                from: 'characters',
                localField: 'charIds',
                foreignField: '_id',
                as: 'characterDocs'
            }
        }
    ];

    var results = await Match.aggregate(pipeline);

    return results
        .filter(function(r) { return r.gameDoc; })
        .map(function(r) {
            return {
                game: r.gameDoc,
                characters: r.characterDocs || []
            };
        });
}

/** Mutates a plain player object to replace GamesPlayed ObjectId refs with full documents. */
async function populateGamesPlayed(player) {
    if (!player || !player.GamesPlayed || player.GamesPlayed.length === 0) return;
    var gameIds = player.GamesPlayed.map(gp => gp.Game).filter(Boolean);
    var charIds = player.GamesPlayed.reduce((acc, gp) => acc.concat(gp.Characters || []), []).filter(Boolean);

    var [games, characters] = await Promise.all([
        Game.find({ _id: { $in: gameIds } }, 'Title LogoUrl Abbreviation').lean(),
        Character.find({ _id: { $in: charIds } }, 'Name AvatarUrl ImageUrl Slug').lean(),
    ]);

    var gamesMap = {};
    games.forEach(function(g) { gamesMap[String(g._id)] = g; });
    var charsMap = {};
    characters.forEach(function(c) { charsMap[String(c._id)] = c; });

    player.GamesPlayed = player.GamesPlayed
        .map(function(gp) {
            var game = gamesMap[String(gp.Game)] || null;
            if (!game) return null;
            return {
                Game: game,
                Characters: (gp.Characters || []).map(function(cid) { return charsMap[String(cid)] || null; }).filter(Boolean),
            };
        })
        .filter(Boolean);
}

// Fetch single player (with GamesPlayed derived from match history)
async function getPlayer(playerId) {
    const player = await Player.findById(
        playerId,
        'Name ImageUrl Slug MatchupAppearance Twitter Stream Youtube AccountId GamesPlayed'
    ).lean();
    if (!player) return null;

    // If the player has manually-curated GamesPlayed, populate and use those
    if (player.GamesPlayed && player.GamesPlayed.length > 0) {
        await populateGamesPlayed(player);
    } else {
        // Otherwise derive from match history
        try {
            player.GamesPlayed = await deriveGamesPlayedFromMatches(player._id);
        } catch (e) {
            console.error('deriveGamesPlayedFromMatches error:', e);
            player.GamesPlayed = [];
        }
    }
    return player;
}

// Update a player
function updatePlayer(playerId, playerData) {
    return new Promise((resolve, reject) => {
        Player.findById(playerId, 'Name PlayerImg', function (error, player) {
            if (error) {
                reject(error);
                return;
            }

            player.Name = playerData.Name;
            player.PlayerImg = playerData.PlayerImg;

            player.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({success: true});
                }
            });
        });
    });
}

// Delete a player
function deletePlayer(playerId) {
    return new Promise((resolve, reject) => {
        Player.remove({
            _id: playerId
        }, function (err, player) {
            if (err) {
                reject(err);
            } else {
                resolve({success: true});
            }
        });
    });
}

// Query Player
function queryPlayer(queryParams) {
    return new Promise((resolve, reject) => {
        var names = queryParams.queryName.split(",");
        var values = queryParams.queryValue.split(",");
        var queries = [];
        var limit = parseLimit(queryParams, undefined, 50);
        var skip = parseSkip(queryParams);
        var sortObj = parseSortWithDirection(queryParams, 'MatchupAppearance', -1);

        for (var i = 0; i < names.length; i++) {
            var query = {};
            if (names[i] === ('Id')) {
                var query = {'_id': ObjectId(values[i])};
                queries.push(query);
            } else {
                query[names[i]] = values[i];
                queries.push(query);
            }
        }

        if (queries.length > 1) {
            var query = Player.find({$or: queries}, 'Name PlayerImg ').sort(sortObj).skip(skip);
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            query.exec(function (error, players) {
                if (error) {
                    reject(error);
                } else {
                    resolve({players: players});
                }
            });
        } else {
            var query = Player.find(queries[0], 'Name PlayerImg ').sort(sortObj).skip(skip);
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            query.exec(function (error, players) {
                if (error) {
                    reject(error);
                } else {
                    resolve({players: players});
                }
            });
        }
    });
}

function getPlayerBySlug(slug) {
    return new Promise((resolve, reject) => {
        if (!slug) { return resolve({ players: [] }); }

        function escapeRegex(s) {
            return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // Accept slug as-is (case-insensitive) OR match by name derived from slug
        var namePattern = escapeRegex(slug.replace(/-/g, ' '));
        var orConditions = [
            { Slug: { $regex: new RegExp('^' + escapeRegex(slug) + '$', 'i') } },
            { Name: { $regex: new RegExp('^' + namePattern + '$', 'i') } },
        ];

        Player.aggregate([{ $match: { $or: orConditions } }], async function (error, players) {
            if (error) {
                reject(error);
            } else {
                try {
                    for (var i = 0; i < players.length; i++) {
                        var p = players[i];
                        if (p.GamesPlayed && p.GamesPlayed.length > 0) {
                            await populateGamesPlayed(p);
                        } else {
                            p.GamesPlayed = await deriveGamesPlayedFromMatches(p._id);
                        }
                    }
                    resolve({ players: players });
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

async function mergePlayers(player1Id, player2Id) {
    return new Promise((resolve, reject) => {
        var player1IdObj = ObjectId(player1Id);
        var player2IdObj = ObjectId(player2Id);
        var player1Query = {'Team1Players': {$elemMatch: {Id: player1IdObj}}};
        var player2Query = {'Team2Players': {$elemMatch: {Id: player1IdObj}}};

        var player1setQuery = {$set: {'Team1Players.$[].Id': player2IdObj}};
        var player2setQuery = {$set: {'Team2Players.$[].Id': player2IdObj}};

        Match.updateMany(player1Query, player1setQuery, function (res, error) {
            if (error) {
                reject(error);
                return;
            }
        });
        Match.updateMany(player2Query, player2setQuery, function (res, error) {
            if (error) {
                reject(error);
                return;
            }
        });
        TournamentMatch.updateMany(player1Query, player1setQuery, function (res, error) {
            if (error) {
                reject(error);
                return;
            }
        });
        TournamentMatch.updateMany(player2Query, player2setQuery, function (res, error) {
            if (error) {
                reject(error);
                return;
            }
        });
        Player.deleteOne({
            _id: player1Id
        }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve('Player Merged');
            }
        });
    });
}

module.exports = {
    addPlayer,
    getPlayer,
    getPlayers,
    updatePlayer,
    deletePlayer,
    queryPlayer,
    getPlayerBySlug,
    mergePlayers
};
