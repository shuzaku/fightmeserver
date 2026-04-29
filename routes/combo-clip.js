const express = require('express');
const router = express.Router();
const comboClipController = require('../controller/combo-clip');

// Combo Clip routes
router.get('/comboClip/:id', comboClipController.getComboClip);
router.get('/comboClipsQuery', comboClipController.queryComboClips);

module.exports = router;
