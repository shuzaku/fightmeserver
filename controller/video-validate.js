var videoValidateService = require("../service/video-validate-service");

// Add new video for validation
function addVideoValidate(req, res) {
    videoValidateService.addVideoValidate(req.body)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: 'Error saving video for validation',
                error: error.message
            });
        });
}

function getVideoValidate(req, res) {
    videoValidateService.getVideoValidate()
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send({
                success: false,
                message: 'Error fetching video validations',
                error: error.message
            });
        });
}

function approveVideoValidate(req, res) {
    videoValidateService.approveVideoValidate(req.params.id, req.body.status)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.log('Error:', error);
            res.status(500).send({
                success: false,
                message: 'Error approving video for validation',
                error: error.message
            });
        });
}

module.exports = { addVideoValidate, getVideoValidate, approveVideoValidate };