var Creator = require("../models/creators");
var ObjectId = require('mongodb').ObjectId;

// Add new creator
function addCreator(creatorData) {
    return new Promise((resolve, reject) => {
        var new_creator = new Creator({
            Name: creatorData.Name,
            Url: creatorData.Url,
            LogoUrl: creatorData.LogoUrl,
            YoutubeUrl: creatorData.YoutubeUrl,
            YoutubeId: creatorData.YoutubeId
        });

        new_creator.save(function (error, creator) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Post saved successfully!',
                    id: creator.id
                });
            }
        });
    });
}

// Fetch all creators
function getCreators() {
    return new Promise((resolve, reject) => {
        Creator.find({}, 'Name LogoUrl YoutubeUrl YoutubeId', function (error, creators) {
            if (error) {
                reject(error);
            } else {
                resolve({creators: creators});
            }
        }).sort({_id: -1});
    });
}

// Fetch single creator
function getCreator(creatorId) {
    return new Promise((resolve, reject) => {
        Creator.findById(creatorId, 'Name LogoUrl YoutubeUrl YoutubeId', function (error, creator) {
            if (error) {
                reject(error);
            } else {
                resolve(creator);
            }
        });
    });
}

// Update a creator
function updateCreator(creatorId, creatorData) {
    return new Promise((resolve, reject) => {
        Creator.findById(creatorId, 'Name LogoUrl YoutubeUrl YoutubeId', function (error, creator) {
            if (error) {
                reject(error);
                return;
            }

            creator.Name = creatorData.Name;
            creator.LogoUrl = creatorData.LogoUrl;
            creator.YoutubeUrl = creatorData.YoutubeUrl;
            creator.YoutubeId = creatorData.YoutubeId;

            creator.save(function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve({success: true});
                }
            });
        });
    });
}

// Delete a creator
function deleteCreator(creatorId) {
    return new Promise((resolve, reject) => {
        Creator.remove({
            _id: creatorId
        }, function (err, creator) {
            if (err) {
                reject(err);
            } else {
                resolve({success: true});
            }
        });
    });
}

module.exports = {
    addCreator,
    getCreators,
    getCreator,
    updateCreator,
    deleteCreator
};
