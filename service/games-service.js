var Game = require("../models/games");
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

// Add new game
function addGame(gameData) {
    return new Promise((resolve, reject) => {
        // First check if game title already exists
        Game.findOne({ Title: gameData.Title }, function(error, existingGame) {
            if (error) {
                reject(error);
                return;
            }
            
            if (existingGame) {
                reject({
                    success: false,
                    message: 'Game with this title already exists',
                    existingGameId: existingGame._id,
                    existingGameTitle: existingGame.Title
                });
                return;
            }
            
            // Title is unique, proceed with creating new game
            var new_game = new Game({
                Title: gameData.Title,
                LogoUrl: gameData.LogoUrl,
                CoverArt: gameData.CoverArt,
                Abbreviation: gameData.Abbreviation,
                ReleaseDate: gameData.ReleaseDate
            });

            new_game.save(function (error, savedGame) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Post saved successfully!',
                        gameId: savedGame._id
                    });
                }
            });
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
            var value = values[i];
            
            // Handle boolean values
            if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }
            
            query[names[i]] = value;
            queries.push(query);
        }

        if (queries.length > 1) {
            Game.find({$or: queries}, 'Title LogoUrl CoverArt ReleaseDate IsFeatured', function (error, games) {
                if (error) {
                    reject(error);
                } else {
                    resolve({games: games});
                }
            }).sort({ReleaseDate: 1});
        } else {
            Game.find(queries[0], 'Title LogoUrl CoverArt ReleaseDate IsFeatured', function (error, games) {
                if (error) {
                    reject(error);
                } else {
                    resolve({games: games});
                }
            }).sort({ReleaseDate: 1});
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

// Get game statistics (counts only)
function getGameStats(gameId) {
    return new Promise((resolve, reject) => {
        var Character = require("../models/characters");
        var Video = require("../models/videos");
        var TournamentMatch = require("../models/tournament-matches");
        var Tournament = require("../models/tournaments");

        var gameIdObj = safeObjectId(gameId);
        if (!gameIdObj) {
            resolve({
                characters: 0,
                matches: 0,
                tournaments: 0,
                combos: 0,
            });
            return;
        }

        // Run all count queries in parallel
        Promise.all([
            // Count characters
            Character.countDocuments({ GameId: gameIdObj }),
            // Match videos for this game (VideoType has varied historically; all Match docs count here)
            Video.countDocuments({
                GameId: gameIdObj,
                ContentType: 'Match',
            }),
            // Count tournament matches
            TournamentMatch.countDocuments({ GameId: gameIdObj }),
            // Count tournaments (where Games array contains the gameId)
            Tournament.countDocuments({ Games: gameIdObj }),
            // Count combos (videos with ContentType 'Combo')
            Video.countDocuments({ 
                GameId: gameIdObj, 
                ContentType: 'Combo'
            })
        ])
        .then(([characters, onlineMatches, tournamentMatches, tournaments, combos]) => {
            resolve({
                characters: characters,
                matches: onlineMatches + tournamentMatches, // Combined match count
                tournaments: tournaments,
                combos: combos
            });
        })
        .catch(error => {
            reject(error);
        });
    });
}

module.exports = {
    addGame,
    getGames,
    getGame,
    queryGame,
    updateGame,
    deleteGame,
    getGameStats  // Add this
};
