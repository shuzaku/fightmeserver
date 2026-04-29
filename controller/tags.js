var tagService = require("../service/tags-service");

// Fetch all Tags
function getTags(req, res) {
    tagService.getTags()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching tags',
                error: error.message
            });
        });
}

// Add new Tag
function addTag(req, res) {
    tagService.addTag(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving tag',
                error: error.message
            });
        });
}

module.exports = { getTags, addTag}