var FeaturedVideos = require("../models/featured-videos");
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

// Add new featured video
function addFeaturedVideo(featuredVideoData) {
    return new Promise((resolve, reject) => {
        // Convert GameIds array to ObjectIds if provided
        var gameIds = [];
        if (featuredVideoData.GameIds && Array.isArray(featuredVideoData.GameIds)) {
            gameIds = featuredVideoData.GameIds.map(id => {
                try {
                    return new ObjectId(id);
                } catch (error) {
                    return null;
                }
            }).filter(id => id !== null);
        }

        // Convert CreatorId to ObjectId if provided
        var creatorId = null;
        if (featuredVideoData.CreatorId) {
            try {
                creatorId = new ObjectId(featuredVideoData.CreatorId);
            } catch (error) {
                // Invalid CreatorId, will be null
            }
        }

        var new_featured_video = new FeaturedVideos({
            VideoUrl: featuredVideoData.VideoUrl,
            CreatorId: creatorId,
            GameIds: gameIds,
            Type: featuredVideoData.Type || 'General'
        });

        new_featured_video.save(function (error, featuredVideo) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Featured video saved successfully!',
                    id: featuredVideo.id
                });
            }
        });
    });
}

module.exports = {
    addFeaturedVideo
};

