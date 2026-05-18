const express = require('express');
const router = express.Router();
const { getTwitterVideo, streamTwitterVideo } = require('../controller/twitter-video');

router.get('/twitter-video', getTwitterVideo);
router.get('/twitter-video-stream', streamTwitterVideo);

module.exports = router;
