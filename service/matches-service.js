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

module.exports = 
{
    findMatchesByPlayerId 
}