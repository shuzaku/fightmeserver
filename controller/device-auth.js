const deviceAuthService = require('../service/device-auth-service');

// POST /auth/device/authorize
// Called by the Vue web app after the user clicks "Authorize" on the
// consent screen. Requires a verified Firebase ID token (see
// requireFirebaseAuth middleware on the route).
//
// Body: { deviceName?: string }
// Returns: { success: true, token: string, tokenId: string }
//   — `token` is the plaintext device token, shown/handed off exactly once.
async function authorizeDevice(req, res) {
    try {
        const { uid, email, name: displayName } = req.firebaseUser;
        const { deviceName } = req.body || {};

        const result = await deviceAuthService.authorizeDevice({
            firebaseUid: uid,
            email,
            displayName,
            deviceName,
        });

        res.send({
            success: true,
            token: result.token,
            tokenId: result.tokenId,
        });
    } catch (err) {
        console.error('[device-auth] authorizeDevice failed:', err);
        res.status(500).send({
            success: false,
            message: 'Failed to authorise device',
            error: err.message,
        });
    }
}

// GET /auth/device
// Lists the authenticated user's active devices (for the settings page).
// Requires Firebase auth — we don't want device tokens listing other devices.
async function listDevices(req, res) {
    try {
        const { uid } = req.firebaseUser;
        const result = await deviceAuthService.listDevices(uid);
        res.send(result);
    } catch (err) {
        console.error('[device-auth] listDevices failed:', err);
        res.status(500).send({ success: false, error: err.message });
    }
}

// DELETE /auth/device/:tokenId
// Revokes a specific device token.
async function revokeDevice(req, res) {
    try {
        const { uid } = req.firebaseUser;
        const { tokenId } = req.params;
        const result = await deviceAuthService.revokeDevice(uid, tokenId);
        res.send(result);
    } catch (err) {
        console.error('[device-auth] revokeDevice failed:', err);
        res.status(500).send({ success: false, error: err.message });
    }
}

// GET /auth/me
// Called by the desktop app on startup and after login. Requires a device
// token. Returns the account + linked player so the app can hydrate its UI.
async function getSession(req, res) {
    try {
        const result = await deviceAuthService.getSession(req.account);
        res.send(result);
    } catch (err) {
        console.error('[device-auth] getSession failed:', err);
        res.status(500).send({ success: false, error: err.message });
    }
}

// PUT /auth/linkedPlayer
// Body: { playerId: string | null }
// Lets a logged-in user associate a Players doc with their account.
async function linkPlayer(req, res) {
    try {
        const { uid } = req.firebaseUser;
        const { playerId } = req.body || {};
        const result = await deviceAuthService.linkPlayer(uid, playerId || null);
        res.send(result);
    } catch (err) {
        console.error('[device-auth] linkPlayer failed:', err);
        res.status(500).send({ success: false, error: err.message });
    }
}

module.exports = {
    authorizeDevice,
    listDevices,
    revokeDevice,
    getSession,
    linkPlayer,
};
