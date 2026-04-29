var Player = require("../models/players");
var Match = require("../models/matches");
var ObjectId = require('mongodb').ObjectId;

function findMatchesByPlayerId(playerId){
    return new Promise(resolve => {
        var queries = [];

        var aggregate = [     
        {
        '$lookup': {
            'from': 'players', 
            'localField': 'Team1Players.Id', 
            'foreignField': '_id', 
            'as': 'Team1Player'
        }
        }, {
        '$lookup': {
            'from': 'players', 
            'localField': 'Team2Players.Id', 
            'foreignField': '_id', 
            'as': 'Team2Player'
        }
        }, {
        '$unwind': {
            'path': '$Player', 
            'preserveNullAndEmptyArrays': true
        }
        } ];

        var playerQuery= [
        {"Team1Players": { '$elemMatch': { 'Id':  ObjectId(playerId) } }},
        {"Team2Players": { '$elemMatch': { 'Id':  ObjectId(playerId) } }}
        ];  

        queries.push({$or: playerQuery});
        aggregate.push({$match: {$and: queries}});
        Match.aggregate(aggregate, function (error, matches) {
            if (error) { 
                console.error(error); 
            }
            resolve(matches)
        })  
    });
        
}

// Add new matches(s)
function addMatches(matchData, isBulk = false) {
    return new Promise((resolve, reject) => {
        if (!isBulk) {
            var new_match = new Match({
                Team1Players: matchData.Team1Players.map(player => {
                    return {
                        Slot: 1,
                        Id: ObjectId(player.Id),
                        CharacterIds: player.CharacterIds.map(character => {
                            return ObjectId(character.id)
                        })
                    }
                }),
                Team2Players: matchData.Team2Players.map(player => {
                    return {
                        Slot: 2,
                        Id: ObjectId(player.Id),
                        CharacterIds: player.CharacterIds.map(character => {
                            return ObjectId(character.id)
                        })
                    }
                }),
                VideoUrl: matchData.VideoUrl,
                GameId: ObjectId(matchData.GameId),
                GameVersion: matchData.GameVersion,
                TournamentId: ObjectId(matchData.TournamentId),
                WinningPlayersId: matchData.WinningPlayersId ? matchData.WinningPlayersId : null,
                LosingPlayersId: matchData.LosingPlayersId ? matchData.LosingPlayersId : null,
                StartTime: matchData.StartTime,
                EndTime: matchData.EndTime,
                TournamentMatchType: ObjectId(matchData.TournamentMatchType)
            });

            new_match.save(function (error, match) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        match: match,
                        success: true,
                        message: 'Post saved successfully!'
                    });
                }
            });
        } else {
            var matches = matchData.map(match => {
                return {
                    VideoUrl: match.VideoUrl,
                    GameId: ObjectId(match.GameId),
                    GameVersion: match.GameVersion,
                    WinnerIds: match.WinnerIds,
                    LoserIds: match.LoserIds,
                    Team1Players: [
                        {
                            Slot: 1,
                            Id: ObjectId(match.Team1Players[0].Id),
                            CharacterIds: match.Team1Players[0].CharacterIds.map(id => {
                                return ObjectId(id)
                            })
                        }
                    ],
                    Team2Players: [
                        {
                            Slot: 2,
                            Id: ObjectId(match.Team2Players[0].Id),
                            CharacterIds: match.Team2Players[0].CharacterIds.map(id => {
                                return ObjectId(id)
                            })
                        }
                    ],
                    StartTime: match.StartTime,
                    EndTime: match.EndTime,
                    SubmittedBy: match.SubmittedBy,
                    UpdatedBy: match.UpdatedBy,
                    TournamentId: ObjectId(match.TournamentId),
                    TournamentMatchType: match.TournamentMatchType
                }
            });

            Match.insertMany(matches, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Match saved successfully!',
                        matches: matches
                    });
                }
            });
        }
    });
}

// Fetch all matches
function getMatches() {
    return new Promise((resolve, reject) => {
        Match.find({}, 'VideoUrl', function (error, matches) {
            if (error) {
                reject(error);
            } else {
                resolve({ matches: matches });
            }
        }).sort({_id: -1});
    });
}

// Update a matches
function patchMatch(matchId, matchData) {
    return new Promise((resolve, reject) => {
        Match.findById(ObjectId(matchId), 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds ', function (error, match) {
            if (error) {
                reject(error);
                return;
            }

            var Team1Players = matchData.Team1Players;
            var Team2Players = matchData.Team2Players;
            var VideoUrl = matchData.VideoUrl;
            var GameId = ObjectId(matchData.GameId);
            var GameVersion = ObjectId(matchData.GameVersion);
            var WinnerIds = matchData.WinnerIds;
            var LoserIds = matchData.LoserIds;

            match.Team1Players = Team1Players.map(player => {
                return {
                    Slot: 1,
                    Id: ObjectId(player.Id),
                    CharacterIds: player.CharacterIds.map(id => {
                        return ObjectId(id)
                    })
                }
            });
            match.Team2Players = Team2Players.map(player => {
                return {
                    Slot: 2,
                    Id: ObjectId(player.Id),
                    CharacterIds: player.CharacterIds.map(id => {
                        return ObjectId(id)
                    })
                }
            });
            match.VideoUrl = VideoUrl;
            match.GameId = GameId;
            match.GameVersion = GameVersion;

            match.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ success: true });
                }
            });
        });
    });
}

// Fetch single match
function getMatch(matchId) {
    return new Promise((resolve, reject) => {
        var matchIdObj = ObjectId(matchId);

        var aggregate = [
            {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Team1Players.Id',
                    'foreignField': '_id',
                    'as': 'Team1Player'
                }
            }, {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Team2Players.Id',
                    'foreignField': '_id',
                    'as': 'Team2Player'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Team1Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Team1PlayerCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Team2Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Team2PlayerCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'games',
                    'localField': 'GameId',
                    'foreignField': '_id',
                    'as': 'Game'
                }
            },
        ];

        aggregate.unshift({$match: {_id: matchIdObj}});

        Match.aggregate(aggregate, function (error, matches) {
            if (error) {
                reject(error);
            } else {
                resolve({ matches: matches });
            }
        });
    });
}

// Delete single match
function deleteMatch(matchId) {
    return new Promise((resolve, reject) => {
        Match.remove({
            _id: matchId
        }, function (err, character) {
            if (err) {
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
}

// Query Matches
function queryMatches(queryParams) {
    return new Promise((resolve, reject) => {
        var names = queryParams.queryName.split(",");
        var values = queryParams.queryValue.split(",");
        var queries = [];
        var aggregate = [];

        if (names.length > 0) {
            for (var i = 0; i < names.length; i++) {
                var query = {};
                if (names[i] === 'GameId') {
                    query[names[i]] = {'$eq': ObjectId(values[i])};
                }
                if (names[i] === 'Id') {
                    query['_id'] = {'$eq': ObjectId(values[i])};
                } else {
                    query[names[i]] = {'$eq': values[i]}
                }
                queries.push(query);
            }
        } else {
            for (var i = 0; i < names.length; i++) {
                var query = {};
                query[names[i]] = values[i];
                queries.push(query);
            }
        }

        if (queries.length > 0) {
            aggregate.push({$match: {$or: queries}});
        }

        if (queries.length > 0) {
            Match.find({$or: queries}, 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, matches) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ matches: matches });
                }
            }).sort({_id: -1});
        } else {
            Match.find(queries[0], 'Team1Players Team2Players VideoUrl GameId GameVersion WinnerIds LoserIds', function (error, matches) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ matches: matches });
                }
            }).sort({_id: -1});
        }
    });
}

// Update a matches
function patchMatches(matchData) {
    return new Promise((resolve, reject) => {
        var queries = matchData.map(match => {
            return ObjectId(match.id)
        });

        var now = Date.now();

        const update = {$set: {"Updated": now}};
        const settings = {upsert: true};
        Match.updateMany({}, update, function (error, results) {
            if (error) {
                reject(error);
            } else {
                resolve({ success: true });
            }
        });
    });
}

module.exports = {
    findMatchesByPlayerId,
    addMatches,
    getMatches,
    patchMatch,
    getMatch,
    deleteMatch,
    queryMatches,
    patchMatches
};