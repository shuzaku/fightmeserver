const express = require('express');
const router = express.Router();
const videoController = require('../controller/videos');

// Videos routes
router.post('/video', videoController.addVideo);
router.post('/video/:id/view', videoController.incrementViews);
router.get('/videos', videoController.fetchVideos);
router.get('/videoQuery', videoController.queryVideo);
router.get('/video/:id', videoController.getVideo);
router.get('/videoCharacterQuery', videoController.queryVideoByCharacter);
router.get('/videoPlayerQuery', videoController.queryVideoByPlayer);
router.get('/videoGameQuery', videoController.queryVideoByGame);
router.put('/video/:id', videoController.patchVideo);
router.delete('/videos/:id', videoController.deleteVideo);
router.post('/getVideos', videoController.getVideos);
router.get('/comboVideo/:url', videoController.getComboVideo);
router.get('/matchVideo/:url', videoController.getMatchVideo);
router.get('/video-by-match/:matchId', videoController.getVideoByMatchId);

module.exports = router;
