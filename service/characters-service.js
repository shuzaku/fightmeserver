var Character = require("../models/characters");
var ObjectId = require('mongodb').ObjectId;
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");

// Add new character(s)
function addCharacter(characterData, isBulk = false) {
    return new Promise((resolve, reject) => {
        if (!isBulk) {
            var new_character = new Character({
                Name: characterData.Name,
                GameId: characterData.GameId,
                ImageUrl: characterData.ImageUrl,
                AvatarUrl: characterData.AvatarUrl
            });

            new_character.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Character saved successfully!'
                    });
                }
            });
        } else {
            Character.insertMany(characterData, function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Characters saved successfully!'
                    });
                }
            });
        }
    });
}

// Query Characters
function queryCharacter(queryParams) {
    return new Promise((resolve, reject) => {
        var names = queryParams.queryName?.split(",");
        var values = queryParams.queryValue?.split(",");
        var queries = [];
        // Create a mock req object for the query utils
        const mockReq = { query: queryParams };
        var limit = parseLimit(mockReq, undefined, 50);
        var skip = parseSkip(mockReq);
        var sortObj = parseSortWithDirection(mockReq, 'Name', 1);

        if (names) {
            for (var i = 0; i < names.length; i++) {
                var query = {};
                if (names[i] === ('Id')) {
                    var query = {'_id': ObjectId(values[i])};
                    queries.push(query);
                } else if (names[i] === 'GameId') {
                    var query = {'GameId': ObjectId(values[i])};
                    queries.push(query);
                } else {
                    query[names[i]] = values[i];
                    queries.push(query);
                }
            }
        }

        if (queries.length > 1) {
            var query = Character.find({ $or: queries }, 'Name ImageUrl AvatarUrl Slug').sort(sortObj).skip(skip);
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            query.exec(function (error, characters) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ characters: characters });
                }
            });
        } else {
            var query = Character.find(queries[0], 'Name ImageUrl AvatarUrl Slug').sort(sortObj).skip(skip);
            if (limit !== undefined) {
                query = query.limit(limit);
            }
            query.exec(function (error, characters) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ characters: characters });
                }
            });
        }
    });
}

// Fetch all characters
function getCharacters(queryParams = {}) {
    return new Promise((resolve, reject) => {
        // Create a mock req object for the query utils
        const mockReq = { query: queryParams };
        var limit = parseLimit(mockReq, undefined, 100);
        var skip = parseSkip(mockReq);
        var sortObj = parseSortWithDirection(mockReq, '_id', -1);

        var query = Character.find({}, 'Name GameId ImageUrl AvatarUrl FeaturedPlayers').sort(sortObj).skip(skip);
        if (limit !== undefined) {
            query = query.limit(limit);
        }
        query.exec(function (error, characters) {
            if (error) {
                reject(error);
            } else {
                resolve({ characters: characters });
            }
        });
    });
}

// Fetch single character
function getCharacter(characterId) {
    return new Promise((resolve, reject) => {
        var aggregate = [{
            '$lookup': {
                'from': 'players',
                'localField': 'FeaturedPlayers',
                'foreignField': '_id',
                'as': 'Players'
            }
        }];
        aggregate.push({$match: {"_id": ObjectId(characterId)}});

        Character.aggregate(aggregate, function (error, characters) {
            if (error) {
                reject(error);
            } else {
                resolve({ characters: characters });
            }
        });
    });
}

// Fetch single character by slug
function getCharacterBySlug(slug) {
    return new Promise((resolve, reject) => {
        var aggregate = [{
            '$lookup': {
                'from': 'players',
                'localField': 'FeaturedPlayers',
                'foreignField': '_id',
                'as': 'Players'
            }
        }];
        aggregate.push({$match: {"Slug": slug}});

        Character.aggregate(aggregate, function (error, characters) {
            if (error) {
                reject(error);
            } else {
                resolve({ characters: characters });
            }
        });
    });
}

// Update a character
function updateCharacter(characterId, characterData) {
    return new Promise((resolve, reject) => {
        Character.findById(characterId, 'Name GameId ImageUrl AvatarUrl FeaturedPlayers', function (error, character) {
            if (error) {
                reject(error);
                return;
            }
            
            character.Name = characterData.Name;
            character.GameId = characterData.GameId;
            character.ImageUrl = characterData.ImageUrl;
            character.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ success: true });
                }
            });
        });
    });
}

// Delete a character
function deleteCharacter(characterId) {
    return new Promise((resolve, reject) => {
        Character.remove({
            _id: characterId
        }, function (err, character) {
            if (err) {
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
}

// Query matchup info
function getMatchupInfo(character1Id, character2Id) {
    return new Promise((resolve, reject) => {
        var queries = [];
        var character1 = ObjectId(character1Id);
        var character2 = ObjectId(character2Id);

        queries.push({'_id': character1});
        queries.push({'_id': character2});

        Character.find({ $or: queries }, 'Name ImageUrl AvatarUrl GameId FeaturedPlayers', function (error, characters) {
            if (error) {
                reject(error);
            } else {
                resolve({ characters: characters });
            }
        });
    });
}

module.exports = {
    addCharacter,
    queryCharacter,
    getCharacters,
    getCharacter,
    updateCharacter,
    deleteCharacter,
    getMatchupInfo,
    getCharacterBySlug
};
