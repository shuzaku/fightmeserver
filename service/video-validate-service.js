var VideoValidate = require("../models/video-validate");
var Video = require("../models/videos");
var Match = require("../models/matches");
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
        VideoValidate.find({}).then(function (video_validates) {
            resolve({
                success: true,
                video_validates: video_validates
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
                VideoUrl: videoValidate.VideoUrl,
                GameId: videoValidate.GameId,
                ContentType: videoValidate.ContentType,
                ContentCreatorId: videoValidate.ContentCreatorId,
                VideoType: videoValidate.VideoType,
                StartTime: videoValidate.StartTime,
                EndTime: videoValidate.EndTime,
                Tags: videoValidate.Tags,
                SubmittedBy: videoValidate.SubmittedBy,
                UpdatedBy: videoValidate.UpdatedBy,
                // Map team players to individual players for video record
                Player1Id: videoValidate.Team1Players && videoValidate.Team1Players.length > 0 ? videoValidate.Team1Players[0] : null,
                Player2Id: videoValidate.Team2Players && videoValidate.Team2Players.length > 0 ? videoValidate.Team2Players[0] : null
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

                    // Update video validation status
                    VideoValidate.findByIdAndUpdate(videoValidateId, { $set: { status: status } }, { new: true }).then(function (updatedVideoValidate) {
                        resolve({
                            success: true,
                            message: 'Video approved and records created successfully!',
                            videoId: newVideo._id,
                            matchId: newMatch._id
                        });
                    }).catch(function (updateError) {
                        reject(updateError);
                    });
                });
            });
        }).catch(function (error) {
            reject(error);
        });
    });
}

module.exports = {
    addVideoValidate,
    getVideoValidate,
    approveVideoValidate
};
