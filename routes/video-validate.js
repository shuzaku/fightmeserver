const express = require('express');
const router = express.Router();
const videoValidateController = require('../controller/video-validate');

// Video Validation routes
router.post('/video-validate', videoValidateController.addVideoValidate);
router.get('/video-validate', videoValidateController.getVideoValidate);
router.put('/video-validate/:id', videoValidateController.approveVideoValidate);

module.exports = router;
