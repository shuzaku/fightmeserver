var Tag = require("../models/tags");

// Fetch all Tags
function getTags() {
    return new Promise((resolve, reject) => {
        Tag.find({}, 'TagName', function (error, tags) {
            if (error) {
                reject(error);
            } else {
                resolve({tags: tags});
            }
        }).sort({_id: -1});
    });
}

// Add new Tag
function addTag(tagData) {
    return new Promise((resolve, reject) => {
        var new_tag = new Tag({
            TagName: tagData.TagName
        });

        new_tag.save(function (error) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    success: true,
                    message: 'Tag saved successfully!'
                });
            }
        });
    });
}

module.exports = {
    getTags,
    addTag
};
