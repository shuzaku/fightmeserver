var VideoValidate = require("../models/video-validate");
var Video = require("../models/videos");
var Match = require("../models/matches");
var Game = require("../models/games");
var Player = require("../models/players");
var Character = require("../models/characters");
var Account = require("../models/accounts");
var ObjectId = require('mongodb').ObjectId;

// Add new video for validation
function addVideoValidate(videoValidateData) {
    return new Promise((resolve, reject) => {
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
            EndTime: videoValidateData.EndTime
        });

        new_video_validate.save(function (error) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Video submitted for validation successfully!'
                });
            }
        });
    });
}

function getVideoValidate() {
    return new Promise((resolve, reject) => {
        VideoValidate.find({})
            .populate('GameId', 'Title LogoUrl CoverArt Abbreviation ReleaseDate')
            .then(function (video_validates) {
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
                                        // CharacterIds are ObjectIds, populate character data
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
                                        // CharacterIds are ObjectIds, populate character data
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
                    // Transform the response to rename GameId to game
                    const transformedVideos = video_validates.map(video => {
                        const transformedVideo = video.toObject();
                        if (transformedVideo.GameId) {
                            transformedVideo.Game = transformedVideo.GameId;
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
                UpdatedBy: videoValidate.UpdatedBy
            });

            // Create match record
            var newMatch = new Match({
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

            // Save video record
            newVideo.save(function (videoError) {
                if (videoError) {
                    reject(videoError);
                    return;
                }

                // Save match record
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
