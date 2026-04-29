const express = require('express');
const router = express.Router();
const videoValidateController = require('../controller/video-validate');

// Video Validation routes
router.post('/video-validate', videoValidateController.addVideoValidate);
router.get('/video-validate', videoValidateController.getVideoValidate);
router.put('/video-validate/:id', videoValidateController.approveVideoValidate);
router.delete('/video-validate/:id', videoValidateController.rejectVideoValidate);
router.post('/video-validate/approve/:id', videoValidateController.approveVideoValidate);
module.exports = router;
