var VideoValidate = require("../models/video-validate");
var Video = require("../models/videos");
var Match = require("../models/matches");
var Game = require("../models/games");
var Player = require("../models/players");
var Character = require("../models/characters");
var Account = require("../models/accounts");
var Combo = require("../models/combos");
var ComboClip = require("../models/combo-clips");
var ObjectId = require('mongodb').ObjectId;

// Add new video for validation
function addVideoValidate(videoValidateData) {
    return new Promise((resolve, reject) => {
        // If this is a combo video with multiple combos, create separate validateVideo records for each combo
        if (videoValidateData.ContentType === 'Combo' && videoValidateData.Combos && videoValidateData.Combos.length > 0) {
            const validateVideoPromises = videoValidateData.Combos.map(comboData => {
                return new Promise((resolveCombo, rejectCombo) => {
                    // Create a new validateVideo record for each combo
                    const new_video_validate = new VideoValidate({
                        Url: videoValidateData.Url,
                        VideoUrl: videoValidateData.VideoUrl,
                        GameId: videoValidateData.GameId,
                        Team1Players: videoValidateData.Team1Players,
                        Team2Players: videoValidateData.Team2Players,
                        SubmittedBy: videoValidateData.SubmittedBy,
                        UpdatedBy: videoValidateData.UpdatedBy,
                        ContentType: videoValidateData.ContentType,
                        ContentCreatorId: videoValidateData.ContentCreatorId,
                        VideoType: videoValidateData.VideoType,
                        Tags: videoValidateData.Tags,
                        StartTime: comboData.StartTime || videoValidateData.StartTime,
                        EndTime: comboData.EndTime || videoValidateData.EndTime,
                        Combos: [comboData] // Single combo per validateVideo record
                    });

                    new_video_validate.save(function (error) {
                        if (error) {
                            rejectCombo(error);
                        } else {
                            resolveCombo({
                                success: true,
                                validateVideoId: new_video_validate._id,
                                combo: comboData
                            });
                        }
                    });
                });
            });

            Promise.all(validateVideoPromises).then(function (results) {
                resolve({
                    success: true,
                    message: `Video submitted for validation successfully! Created ${results.length} individual validateVideo records.`,
                    validateVideoIds: results.map(r => r.validateVideoId),
                    combosProcessed: results.length
                });
            }).catch(function (error) {
                reject(error);
            });
        } else {
            // For non-combo videos or combo videos without combos, create single record as before
            var new_video_validate = new VideoValidate({
                Url: videoValidateData.Url,
                VideoUrl: videoValidateData.VideoUrl,
                GameId: videoValidateData.GameId,
                Team1Players: videoValidateData.Team1Players,
                Team2Players: videoValidateData.Team2Players,
                SubmittedBy: videoValidateData.SubmittedBy,
                UpdatedBy: videoValidateData.UpdatedBy,
                ContentType: videoValidateData.ContentType,
                ContentCreatorId: videoValidateData.ContentCreatorId,
                VideoType: videoValidateData.VideoType,
                Tags: videoValidateData.Tags,
                StartTime: videoValidateData.StartTime,
                EndTime: videoValidateData.EndTime,
                Combos: videoValidateData.Combos
            });

            new_video_validate.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        success: true,
                        message: 'Video submitted for validation successfully!',
                        validateVideoId: new_video_validate._id
                    });
                }
            });
        }
    });
}

function getVideoValidate() {
    return new Promise((resolve, reject) => {
        VideoValidate.aggregate([
            {
                $lookup: {
                    from: 'games',
                    localField: 'GameId',
                    foreignField: '_id',
                    as: 'Game'
                }
            },
            {
                $unwind: '$Game'
            },
            {
                $lookup: {
                    from: 'characters',
                    localField: 'Combos.CharacterId',
                    foreignField: '_id',
                    as: 'ComboCharacters'
                }
            },
            {
                $addFields: {
                    'Combos': {
                        $map: {
                            input: '$Combos',
                            as: 'combo',
                            in: {
                                $mergeObjects: [
                                    '$$combo',
                                    {
                                        CharacterId: {
                                            $filter: {
                                                input: '$ComboCharacters',
                                                as: 'char',
                                                cond: {
                                                    $in: ['$$char._id', '$$combo.CharacterId']
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    ComboCharacters: 0
                }
            }
        ]).then(function (video_validates) {
            // Manually populate player and character data for Team1Players and Team2Players
            const populatePlayersAndCharacters = async () => {
                for (let video of video_validates) {
                    // Populate Team1Players
                    if (video.Team1Players && video.Team1Players.length > 0) {
                        for (let player of video.Team1Players) {
                            if (player.Id) {
                                try {
                                    const playerData = await Player.findById(player.Id, 'Name ImageUrl Slug');
                                    if (playerData) {
                                        player.PlayerData = playerData;
                                    }
                                } catch (error) {
                                    console.log('Error populating Team1 player:', error);
                                }
                            }
                            
                            // Populate character data
                            if (player.CharacterIds && player.CharacterIds.length > 0) {
                                try {
                                    const characterData = await Character.find({'_id': {$in: player.CharacterIds}}, 'Name ImageUrl AvatarUrl Slug');
                                    if (characterData) {
                                        player.CharacterData = characterData;
                                    }
                                } catch (error) {
                                    console.log('Error populating characters:', error);
                                }
                            }
                        }
                    }
                    
                    // Populate Team2Players
                    if (video.Team2Players && video.Team2Players.length > 0) {
                        for (let player of video.Team2Players) {
                            if (player.Id) {
                                try {
                                    const playerData = await Player.findById(player.Id, 'Name ImageUrl Slug');
                                    if (playerData) {
                                        player.PlayerData = playerData;
                                    }
                                } catch (error) {
                                    console.log('Error populating Team2 player:', error);
                                }
                            }
                            
                            // Populate character data
                            if (player.CharacterIds && player.CharacterIds.length > 0) {
                                try {
                                    const characterData = await Character.find({'_id': {$in: player.CharacterIds}}, 'Name ImageUrl AvatarUrl Slug');
                                    if (characterData) {
                                        player.CharacterData = characterData;
                                    }
                                } catch (error) {
                                    console.log('Error populating characters:', error);
                                }
                            }
                        }
                    }
                    
                    // Populate user data for SubmittedBy and UpdatedBy
                    if (video.SubmittedBy) {
                        try {
                            const submittedByUser = await Account.findById(video.SubmittedBy, 'DisplayName Email AccountType');
                            if (submittedByUser) {
                                video.SubmittedByUser = submittedByUser;
                            }
                        } catch (error) {
                            console.log('Error populating SubmittedBy user:', error);
                        }
                    }
                    
                    if (video.UpdatedBy) {
                        try {
                            const updatedByUser = await Account.findById(video.UpdatedBy, 'DisplayName Email AccountType');
                            if (updatedByUser) {
                                video.UpdatedByUser = updatedByUser;
                            }
                        } catch (error) {
                            console.log('Error populating UpdatedBy user:', error);
                        }
                    }
                }
                return video_validates;
            };
            
            populatePlayersAndCharacters().then(() => {
                // Transform the response to keep the populated Game object
                const transformedVideos = video_validates.map(video => {
                    const transformedVideo = { ...video };
                    // Remove GameId since we have the populated Game object
                    if (transformedVideo.GameId) {
                        delete transformedVideo.GameId;
                    }
                    
                    // Add user data
                    transformedVideo.SubmittedByUser = video.SubmittedByUser || null;
                    transformedVideo.UpdatedByUser = video.UpdatedByUser || null;
                    
                    // Ensure PlayerData and CharacterData are included
                    if (transformedVideo.Team1Players) {
                        transformedVideo.Team1Players = transformedVideo.Team1Players.map((player, index) => ({
                            ...player,
                            PlayerData: video.Team1Players[index].PlayerData || null,
                            CharacterData: video.Team1Players[index].CharacterData || null
                        }));
                    }
                    
                    if (transformedVideo.Team2Players) {
                        transformedVideo.Team2Players = transformedVideo.Team2Players.map((player, index) => ({
                            ...player,
                            PlayerData: video.Team2Players[index].PlayerData || null,
                            CharacterData: video.Team2Players[index].CharacterData || null
                        }));
                    }
                    
                    return transformedVideo;
                });
                
                resolve({
                    success: true,
                    video_validates: transformedVideos
                });
            }).catch(error => {
                reject(error);
            });
        }).catch(function (error) {
            reject(error);
        });
    });
}

function approveVideoValidate(videoValidateId, status) {
    return new Promise((resolve, reject) => {
        // First, fetch the video validation record
        VideoValidate.findById(videoValidateId).then(function (videoValidate) {
            if (!videoValidate) {
                reject(new Error('Video validation record not found'));
                return;
            }

            // Create video record
            var newVideo = new Video({
                Url: videoValidate.Url,
                GameId: videoValidate.GameId,
                ContentType: videoValidate.ContentType,
                ContentCreatorId: videoValidate.ContentCreatorId,
                VideoType: videoValidate.VideoType,
                StartTime: videoValidate.StartTime,
                EndTime: videoValidate.EndTime,
                Tags: videoValidate.Tags,
                SubmittedBy: videoValidate.SubmittedBy,
                UpdatedBy: videoValidate.UpdatedBy,
                // For combo videos, include combo data
                Combos: videoValidate.ContentType === 'Combo' ? videoValidate.Combos : undefined
            });

            // Only create match record for Match content type
            var newMatch = null;
            if (videoValidate.ContentType === 'Match') {
                newMatch = new Match({
                    Team1Players: videoValidate.Team1Players,
                    Team2Players: videoValidate.Team2Players,
                    VideoUrl: videoValidate.VideoUrl,
                    GameId: videoValidate.GameId,
                    Tags: videoValidate.Tags,
                    SubmittedBy: videoValidate.SubmittedBy,
                    UpdatedBy: videoValidate.UpdatedBy,
                    StartTime: videoValidate.StartTime,
                    EndTime: videoValidate.EndTime
                });
            }

            // Save video record
            newVideo.save(function (videoError) {
                if (videoError) {
                    reject(videoError);
                    return;
                }

                // Only save match record if it's a Match content type
                if (newMatch) {
                    newMatch.save(function (matchError) {
                        if (matchError) {
                            reject(matchError);
                            return;
                        }

                        // Delete video validation record after successful creation
                        VideoValidate.findByIdAndDelete(videoValidateId).then(function (deletedVideoValidate) {
                            resolve({
                                success: true,
                                message: 'Video approved and records created successfully!',
                                videoId: newVideo._id,
                                matchId: newMatch._id
                            });
                        }).catch(function (deleteError) {
                            reject(deleteError);
                        });
                    });
                } else {
                    // For combo videos, create combo records and combo-clips records
                    if (videoValidate.Combos && videoValidate.Combos.length > 0) {
                        const comboPromises = videoValidate.Combos.map(comboData => {
                            return new Promise((resolveCombo, rejectCombo) => {
                                // Create a new combo record
                                const newCombo = new Combo({
                                    CharacterId: comboData.CharacterId && comboData.CharacterId.length > 0 ? comboData.CharacterId[0] : null,
                                    Inputs: comboData.Inputs ? [comboData.Inputs] : [],
                                    Hits: comboData.Hits ? parseInt(comboData.Hits) : 0,
                                    Damage: comboData.Damage ? parseInt(comboData.Damage) : 0,
                                    Tags: videoValidate.Tags || [],
                                    SubmittedBy: videoValidate.SubmittedBy,
                                    UpdatedBy: videoValidate.UpdatedBy
                                });

                                newCombo.save(function (comboError) {
                                    if (comboError) {
                                        rejectCombo(comboError);
                                        return;
                                    }

                                    // Create combo-clip record linking the video to the combo
                                    const newComboClip = new ComboClip({
                                        ComboId: newCombo._id,
                                        StartTime: comboData.StartTime || videoValidate.StartTime,
                                        EndTime: comboData.EndTime || videoValidate.EndTime,
                                        Url: videoValidate.Url,
                                        Tags: videoValidate.Tags || [],
                                        SubmittedBy: videoValidate.SubmittedBy,
                                        UpdatedBy: videoValidate.UpdatedBy
                                    });

                                    newComboClip.save(function (comboClipError) {
                                        if (comboClipError) {
                                            rejectCombo(comboClipError);
                                        } else {
                                            resolveCombo({
                                                comboId: newCombo._id,
                                                comboClipId: newComboClip._id
                                            });
                                        }
                                    });
                                });
                            });
                        });

                        Promise.all(comboPromises).then(function (comboResults) {
                            // Delete video validation record after successful creation
                            VideoValidate.findByIdAndDelete(videoValidateId).then(function (deletedVideoValidate) {
                                resolve({
                                    success: true,
                                    message: 'Combo video approved and combo records created successfully!',
                                    videoId: newVideo._id,
                                    comboIds: comboResults.map(r => r.comboId),
                                    comboClipIds: comboResults.map(r => r.comboClipId)
                                });
                            }).catch(function (deleteError) {
                                reject(deleteError);
                            });
                        }).catch(function (comboError) {
                            reject(comboError);
                        });
                    } else {
                        // No combos to create, just delete validation record
                        VideoValidate.findByIdAndDelete(videoValidateId).then(function (deletedVideoValidate) {
                            resolve({
                                success: true,
                                message: 'Combo video approved and record created successfully!',
                                videoId: newVideo._id
                            });
                        }).catch(function (deleteError) {
                            reject(deleteError);
                        });
                    }
                }
            });
        }).catch(function (error) {
            reject(error);
        });
    });
}

function rejectVideoValidate(videoValidateId) {
    return new Promise((resolve, reject) => {
        VideoValidate.findByIdAndDelete(videoValidateId)
            .then(function (deletedVideoValidate) {
                if (!deletedVideoValidate) {
                    reject({
                        success: false,
                        message: 'Video validation record not found'
                    });
                    return;
                }
                
                resolve({
                    success: true,
                    message: 'Video validation record rejected and deleted successfully!',
                    deletedId: deletedVideoValidate._id
                });
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

module.exports = {
    addVideoValidate,
    getVideoValidate,
    approveVideoValidate,
    rejectVideoValidate
};
