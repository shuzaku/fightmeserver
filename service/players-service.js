var Player = require("../models/players");
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

// Fetch single player
function getPlayer(playerId) {
    return new Promise((resolve, reject) => {
        Player.findById(playerId, 'Name PlayerImg Slug MatchupAppearance Twitter Stream Youtube', function (error, player) {
            if (error) {
                reject(error);
            } else {
                resolve(player);
            }
        });
    });
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
        var aggregate = [];
        aggregate.push({$match: {"Slug": slug}});

        Player.aggregate(aggregate, function (error, players) {
            if (error) {
                reject(error);
            } else {
                resolve({players: players});
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
