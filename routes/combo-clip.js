const express = require('express');
const router = express.Router();
const comboClipController = require('../controller/combo-clip');

router.post('/comboClip', comboClipController.addComboClip);
router.put('/comboClip/:id', comboClipController.patchComboClip);
router.delete('/comboClip/:id', comboClipController.deleteComboClip);
router.get('/comboClip/:id', comboClipController.getComboClip);
router.get('/comboClipsQuery', comboClipController.queryComboClips);

module.exports = router;
