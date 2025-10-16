var Game = require("../models/games");
var ObjectId = require('mongodb').ObjectId;

// Add new game
function addGame(gameData) {
    return new Promise((resolve, reject) => {
        var new_game = new Game({
            Title: gameData.Title,
            LogoUrl: gameData.LogoUrl,
        });

        new_game.save(function (error) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Post saved successfully!'
                });
            }
        });
    });
}

// Fetch all games
function getGames() {
    return new Promise((resolve, reject) => {
        Game.find({}, 'Title LogoUrl CoverArt Abbreviation ReleaseDate', function (error, games) {
            if (error) {
                reject(error);
            } else {
                resolve({games: games});
            }
        }).sort({ReleaseDate: 1});
    });
}

// Fetch single game
function getGame(gameId) {
    return new Promise((resolve, reject) => {
        Game.findById(gameId, 'Title LogoUrl FeaturedCharacter NewCharacter Banner', function (error, game) {
            if (error) {
                reject(error);
            } else {
                resolve(game);
            }
        });
    });
}

// Query Games
function queryGame(queryParams) {
    return new Promise((resolve, reject) => {
        var names = queryParams.queryName.split(",");
        var values = queryParams.queryValue.split(",");
        var queries = [];

        for (var i = 0; i < names.length; i++) {
            var query = {};
            query[names[i]] = values[i];
            queries.push(query);
        }

        if (queries.length > 1) {
            Game.find({$or: queries}, 'Title Logo', function (error, games) {
                if (error) {
                    reject(error);
                } else {
                    resolve({games: games});
                }
            }).sort({_id: -1});
        } else {
            Game.find(queries[0], 'Title Logo', function (error, games) {
                if (error) {
                    reject(error);
                } else {
                    resolve({games: games});
                }
            }).sort({_id: -1});
        }
    });
}

// Update a game
function updateGame(gameId, gameData) {
    return new Promise((resolve, reject) => {
        Game.findById(gameId, 'Title Logo', function (error, game) {
            if (error) {
                reject(error);
                return;
            }

            game.Title = gameData.GameTitle;
            game.Logo = gameData.Logo;
            game.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({success: true});
                }
            });
        });
    });
}

// Delete a game
function deleteGame(gameId) {
    return new Promise((resolve, reject) => {
        Game.remove({
            _id: gameId
        }, function (err, game) {
            if (err) {
                reject(err);
            } else {
                resolve({success: true});
            }
        });
    });
}

module.exports = {
    addGame,
    getGames,
    getGame,
    queryGame,
    updateGame,
    deleteGame
};
