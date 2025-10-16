var Video = require("../models/videos");
var ObjectId = require('mongodb').ObjectId;
var { parseLimit, parseSkip, parseSort, parseSortWithDirection } = require("../utils/query-utils");

// Add new Video
function addVideo(videoData, isBulk = false) {
    return new Promise((resolve, reject) => {
        if (!isBulk) {
            var new_video = new Video({
                Url: videoData.Url,
                ContentType: videoData.ContentType,
                VideoType: videoData.VideoType,
                StartTime: videoData.StartTime,
                EndTime: videoData.EndTime,
                GameId: videoData.GameId,
                Tags: videoData.Tags,
            });

            if (videoData.ContentCreatorId) {
                new_video.ContentCreatorId = videoData.ContentCreatorId;
            }

            new_video.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Post saved successfully!'
                    });
                }
            });
        } else {
            Video.insertMany(videoData, function(error, videos) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Videos saved successfully!',
                        videos: videos
                    });
                }
            });
        }
    });
}

// Query Videos
function fetchVideos(queryParams) {
    return new Promise((resolve, reject) => {
        var skip = parseSkip(queryParams);
        var limit = parseLimit(queryParams, 5, 20);
        var aggregate = [
            {
                '$sort': {'_id': -1}
            }, {
                '$lookup': {
                    'from': 'matches',
                    'localField': 'Url',
                    'foreignField': 'VideoUrl',
                    'as': 'Match'
                }
            }, {
                '$unwind': {
                    'path': '$Match',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'combo-clips',
                    'localField': 'Url',
                    'foreignField': 'Url',
                    'as': 'ComboClip'
                }
            }, {
                '$unwind': {
                    'path': '$ComboClip',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'combos',
                    'localField': 'ComboClip.ComboId',
                    'foreignField': '_id',
                    'as': 'Combo'
                }
            }, {
                '$unwind': {
                    'path': '$Combo',
                    'preserveNullAndEmptyArrays': true
                }
            },
        ];

        aggregate.push({$skip: skip});
        aggregate.push({$limit: limit});

        Video.aggregate(aggregate, function (error, videos) {
            if (error) {
                reject(error);
            } else {
                resolve({ videos: videos });
            }
        });
    });
}

// Query Videos
function queryVideo(queryParams) {
    return new Promise((resolve, reject) => {
        var queries = [];
        var query = null;
        var skip = parseSkip(queryParams);
        var limit = parseLimit(queryParams, 5, 20);
        var sortObj = parseSortWithDirection(queryParams, '_id', -1);
        var filter = queryParams.filter;
        var tagFilter = queryParams.tag ? ObjectId(queryParams.tag) : null;
        var aggregate = [
            {
                '$lookup': {
                    'from': 'games',
                    'localField': 'GameId',
                    'foreignField': '_id',
                    'as': 'Game'
                }
            }, {
                '$unwind': '$Game'
            }, {
                '$lookup': {
                    'from': 'montages',
                    'localField': 'Url',
                    'foreignField': 'VideoUrl',
                    'as': 'Montage'
                }
            }, {
                '$unwind': {
                    'path': '$Montage',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Montage.Characters',
                    'foreignField': '_id',
                    'as': 'MontageCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'matches',
                    'localField': 'Url',
                    'foreignField': 'VideoUrl',
                    'as': 'Match'
                }
            }, {
                '$unwind': {
                    'path': '$Match',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Match.Team1Players.Id',
                    'foreignField': '_id',
                    'as': 'Team1Players'
                }
            }, {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Match.Team2Players.Id',
                    'foreignField': '_id',
                    'as': 'Team2Players'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Match.Team1Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Team1PlayerCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Match.Team2Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Team2PlayerCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'combo-clips',
                    'localField': 'Url',
                    'foreignField': 'Url',
                    'as': 'ComboClip'
                }
            }, {
                '$unwind': {
                    'path': '$ComboClip',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'creators',
                    'localField': 'ContentCreatorId',
                    'foreignField': '_id',
                    'as': 'ContentCreator'
                }
            }, {
                '$unwind': {
                    'path': '$ContentCreator',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'tags',
                    'localField': 'Combo.Tags',
                    'foreignField': '_id',
                    'as': 'Combo.Tags'
                }
            }, {
                '$lookup': {
                    'from': 'combos',
                    'localField': 'ComboClip.ComboId',
                    'foreignField': '_id',
                    'as': 'Combo'
                }
            }, {
                '$unwind': {
                    'path': '$Combo',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Combo.CharacterId',
                    'foreignField': '_id',
                    'as': 'Character'
                }
            }, {
                '$unwind': {
                    'path': '$Character',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$addFields': {
                    'Id': '$_id'
                }
            }
        ];

        if (queryParams.queryName || queryParams.queryValue) {
            var names = queryParams.queryName.split(",");
            var values = queryParams.queryValue.split(",");
            var query = {};
            //parse query for player id
            for (var i = 0; i < names.length; i++) {
                var query = {};

                switch (names[i]) {
                    case 'PlayerId':
                        var playerQuery = [
                            {"Team1Players": {'$elemMatch': {'_id': ObjectId(values[i])}}},
                            {"Team2Players": {'$elemMatch': {'_id': ObjectId(values[i])}}}
                        ];
                        queries.push({$or: playerQuery});
                        break

                    case 'PlayerSlug':
                        var playerQuery = [
                            {"Team1Players": {'$elemMatch': {'Slug': values[i]}}},
                            {"Team2Players": {'$elemMatch': {'Slug': values[i]}}}
                        ];
                        queries.push({$or: playerQuery});
                        break

                    case 'PlayerMatchupCharacterId':
                        queries = [];
                        var playerId = values[names.indexOf('PlayerId')];
                        var characterId = values[i];
                        var matchupQuery = [
                            {'$and': [{"Team1Players": {'$elemMatch': {'_id': ObjectId(playerId)}}}, {"Team2PlayerCharacters": {'$elemMatch': {'_id': ObjectId(characterId)}}}]},
                            {'$and': [{"Team2Players": {'$elemMatch': {'_id': ObjectId(playerId)}}}, {"Team1PlayerCharacters": {'$elemMatch': {'_id': ObjectId(characterId)}}}]},
                        ]
                        queries.push({$or: matchupQuery});
                        break

                    case 'CharacterMatchupCharacterId':
                        queries = [];
                        var characterId = values[names.indexOf('CharacterId')];
                        var matchupCharacterId = values[i];
                        var matchupQuery = [
                            {'$and': [{"Team1PlayerCharacters": {'$elemMatch': {'_id': ObjectId(characterId)}}}, {"Team2PlayerCharacters": {'$elemMatch': {'_id': ObjectId(matchupCharacterId)}}}]},
                            {'$and': [{"Team2PlayerCharacters": {'$elemMatch': {'_id': ObjectId(characterId)}}}, {"Team1PlayerCharacters": {'$elemMatch': {'_id': ObjectId(matchupCharacterId)}}}]},
                        ]
                        queries.push({$or: matchupQuery});
                        break

                    case 'CharacterId':
                        var characterQuery = [
                            {"Team1PlayerCharacters": {'$elemMatch': {'_id': ObjectId(values[i])}}},
                            {"Team2PlayerCharacters": {'$elemMatch': {'_id': ObjectId(values[i])}}},
                            {'MontageCharacters': {'$elemMatch': {'_id': ObjectId(values[i])}}},
                            {'Combo.CharacterId': {'$eq': ObjectId(values[i])}},
                        ];
                        queries.push({$or: characterQuery});
                        break

                    case 'CharacterSlug':
                        var characterQuery = [
                            {"Team1PlayerCharacters": {'$elemMatch': {'Slug': values[i]}}},
                            {"Team2PlayerCharacters": {'$elemMatch': {'Slug': values[i]}}},
                            {'MontageCharacters': {'$elemMatch': {'Slug': values[i]}}},
                        ];
                        queries.push({$or: characterQuery});
                        break

                    case 'VideoId':
                        queries.push({'_id': {'$eq': ObjectId(values[i])}});
                        break

                    default:
                        if (names[i].includes('Id')) {
                            query[names[i]] = {'$eq': ObjectId(values[i])};
                            queries.push(query);
                        } else {
                            query[names[0]] = {'$eq': values[0]};
                            queries.push(query);
                        }
                }
            }
            if (names.some(n => n === "VideoId")) {
                aggregate.push({$match: {$or: queries}});
            }
        }

        if (queries.length > 0) {
            aggregate.push({$match: {$and: queries}});
        }

        if (filter) {
            if (filter === 'Combo') {
                aggregate.push({$match: {ContentType: 'Combo'}})
            } else if (filter === 'Match') {
                aggregate.push({$match: {ContentType: 'Match'}})
            } else if (filter === 'Montage') {
                aggregate.push({$match: {ContentType: 'Montage'}})
            }
        }
        if (tagFilter) {
            aggregate.push({$match: {"Combo.Tags": {'$elemMatch': {'_id': ObjectId(tagFilter)}}}});
        }

        aggregate.push({$sort: sortObj})
        aggregate.push({$skip: skip});
        aggregate.push({$limit: limit});

        Video.aggregate(aggregate, function (error, videos) {
            if (error) {
                reject(error);
            } else {
                resolve({ videos: videos });
            }
        });
    });
}

// Fetch single Video
function getVideo(videoId) {
    return new Promise((resolve, reject) => {
        var aggregate = [
            {
                '$sort': {'_id': -1}
            },
            {
                '$lookup': {
                    'from': 'games',
                    'localField': 'GameId',
                    'foreignField': '_id',
                    'as': 'Game'
                }
            }, {
                '$unwind': '$Game'
            }, {
                '$lookup': {
                    'from': 'matches',
                    'localField': 'Url',
                    'foreignField': 'VideoUrl',
                    'as': 'Match'
                }
            }, {
                '$unwind': {
                    'path': '$Match',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'creators',
                    'localField': 'ContentCreatorId',
                    'foreignField': '_id',
                    'as': 'ContentCreator'
                }
            }, {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Match.Team1Players.Id',
                    'foreignField': '_id',
                    'as': 'Match.Team1Player'
                }
            }, {
                '$lookup': {
                    'from': 'players',
                    'localField': 'Match.Team2Players.Id',
                    'foreignField': '_id',
                    'as': 'Match.Team2Player'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Match.Team1Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Match.Team1PlayerCharacters'
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Match.Team2Players.CharacterIds',
                    'foreignField': '_id',
                    'as': 'Match.Team2PlayerCharacters'
                }
            }, {
                '$unwind': {
                    'path': '$ContentCreator',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$unwind': {
                    'path': '$Combos',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'combos',
                    'localField': 'Combos.Id',
                    'foreignField': '_id',
                    'as': 'Combo'
                }
            }, {
                '$unwind': {
                    'path': '$Combo',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'characters',
                    'localField': 'Combo.CharacterId',
                    'foreignField': '_id',
                    'as': 'Combo.Character'
                }
            }, {
                '$unwind': {
                    'path': '$Combo.Character',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'tags',
                    'localField': 'Combo.Tags',
                    'foreignField': '_id',
                    'as': 'Combo.ComboTags'
                }
            }, {
                '$addFields': {
                    'Combo.StartTime': '$Combos.StartTime',
                    'Combo.EndTime': '$Combos.Endtime',
                    'ComboCharacterId': '$Combo.CharacterId',
                    'ComboId': '$Combo._id',
                    'Id': '$_id'
                }
            }
        ];
        aggregate.unshift({$match: {'_id': {'$eq': ObjectId(videoId)}}});
        Video.aggregate(aggregate, function (error, video) {
            if (error) {
                reject(error);
            } else {
                resolve({ video: video });
            }
        });
    });
}

// Update a Video
function patchVideo(videoId, videoData) {
    return new Promise((resolve, reject) => {
        Video.findById(videoId, 'ContentCreatorId GameId Player1Id Player2Id Player1CharacterId Player1Character2Id Player1Character3Id Player2CharacterId Player2Character2Id Player2Character3Id Combos WinnerId Tags UpdatedDate', function (error, video) {
            if (error) {
                reject(error);
                return;
            }

            video.ContentCreatorId = videoData.ContentCreatorId;
            video.GameId = ObjectId(videoData.GameId);
            video.Combos = videoData.Combos.map(combo => {
                return {
                    Id: ObjectId(combo.Id),
                    StartTime: combo.StartTime,
                    EndTime: combo.EndTime
                }
            });
            video.Player1Id = videoData.Player1Id;
            video.Player2Id = videoData.Player2Id;
            video.Player1CharacterId = videoData.Player1CharacterId;
            video.Player1Character2Id = videoData.Player1Character2Id;
            video.Player1Character3Id = videoData.Player1Character3Id;
            video.Player2CharacterId = videoData.Player2CharacterId;
            video.Player2Character2Id = videoData.Player2Character2Id;
            video.Player2Character3Id = videoData.Player2Character3Id;
            video.WinnerId = videoData.WinnerId;
            video.Tags = videoData.Tags;
            video.UpdatedDate = Date.now();

            video.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({ success: true });
                }
            });
        });
    });
}

// Delete a Video
function deleteVideo(videoId) {
    return new Promise((resolve, reject) => {
        Video.remove({
            _id: videoId
        }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
}

module.exports = {
    addVideo,
    fetchVideos,
    queryVideo,
    getVideo,
    patchVideo,
    deleteVideo
};
