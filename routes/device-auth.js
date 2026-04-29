const express = require('express');
const router = express.Router();
const controller = require('../controller/device-auth');
const { requireFirebaseAuth, requireDeviceToken } = require('../utils/auth-middleware');

// ── Web-app-facing (Firebase-authed) ─────────────────────────────────────────
// The Vue app calls these on behalf of a signed-in user.

router.post('/auth/device/authorize', requireFirebaseAuth, controller.authorizeDevice);
router.get('/auth/device',            requireFirebaseAuth, controller.listDevices);
router.delete('/auth/device/:tokenId', requireFirebaseAuth, controller.revokeDevice);
router.put('/auth/linkedPlayer',      requireFirebaseAuth, controller.linkPlayer);

// ── Desktop-app-facing (device-token-authed) ─────────────────────────────────
// The FightersEdge AutoStream app calls this with the token the web app
// issued it; returns the account + linked player for the app to operate as.

router.get('/auth/me', requireDeviceToken, controller.getSession);

module.exports = router;
