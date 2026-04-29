var creatorService = require("../service/creators-service");

// Add new creator
function addCreator(req, res) {
    creatorService.addCreator(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving creator',
                error: error.message
            });
        });
};

// Fetch all creators
function getCreators(req, res) {
    creatorService.getCreators()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching creators',
                error: error.message
            });
        });
}

// Fetch single creator
function getCreator(req, res) {
    creatorService.getCreator(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching creator',
                error: error.message
            });
        });
}

// Update a creator
function updateCreator(req, res) {
    creatorService.updateCreator(req.params.id, req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error updating creator',
                error: error.message
            });
        });
}

// Delete a creator
function deleteCreator(req, res) {
    creatorService.deleteCreator(req.params.id)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error deleting creator',
                error: error.message
            });
        });
}

module.exports = { addCreator, getCreators, getCreator, updateCreator, deleteCreator}