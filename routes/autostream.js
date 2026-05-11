// Routes for the FightersEdge AutoStream desktop app.
//
// Every route below requires a valid device token in
// `Authorization: Bearer <token>`. Tokens are issued via the existing
// /auth/device/authorize flow on the Vue web app — see routes/device-auth.js.
//
// We deliberately keep these endpoints separate from the public POST /video
// and POST /matches routes because:
//   1. The public routes are called unauthenticated by the Vue website today,
//      and we don't want to break that.
//   2. Auth-gated endpoints can trust req.account, so they don't have to
//      accept ContentCreatorId / SubmittedBy from the request body.
//   3. Future AutoStream-specific behaviour (rate limiting, telemetry,
//      premium-tier gating) can be added in one place without affecting
//      the website.

const express = require('express');
const router = express.Router();
const controller = require('../controller/autostream');
const { requireDeviceToken } = require('../utils/auth-middleware');

router.post('/autostream/video', requireDeviceToken, controller.createVideo);
router.post('/autostream/match', requireDeviceToken, controller.createMatch);

module.exports = router;
