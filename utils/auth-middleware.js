// Express middleware for the two auth schemes used by device-auth endpoints:
//
//   requireFirebaseAuth   — used by the Vue web app. Expects a Firebase
//                           ID token in `Authorization: Bearer <idToken>`.
//                           On success sets req.firebaseUser = { uid, email, ... }.
//
//   requireDeviceToken    — used by the FightersEdge AutoStream desktop app.
//                           Expects the device token (plaintext) in
//                           `Authorization: Bearer <deviceToken>`.
//                           On success sets req.account = <Account doc>
//                           and req.deviceToken = <subdoc>.
//
// Both schemes return 401 with a plain JSON body on failure.

const crypto = require('crypto');
const Accounts = require('../models/accounts');
const firebaseAdmin = require('./firebase-admin');

function extractBearer(req) {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || typeof header !== 'string') return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
}

function hashToken(plaintext) {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
}

async function requireFirebaseAuth(req, res, next) {
    const token = extractBearer(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Missing Bearer token' });
    }

    try {
        const decoded = await firebaseAdmin.verifyIdToken(token);
        req.firebaseUser = decoded;
        next();
    } catch (err) {
        console.warn('[auth] Firebase ID token verification failed:', err.message);
        return res.status(401).json({ success: false, message: 'Invalid Firebase ID token' });
    }
}

async function requireDeviceToken(req, res, next) {
    const token = extractBearer(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Missing Bearer token' });
    }

    const tokenHash = hashToken(token);

    try {
        // We look up the account whose DeviceTokens subarray contains this hash
        // and isn't revoked. Doing this in a single query keeps it O(1) on the
        // account collection.
        const account = await Accounts.findOne({
            DeviceTokens: {
                $elemMatch: {
                    TokenHash: tokenHash,
                    RevokedAt: null,
                },
            },
        });

        if (!account) {
            return res.status(401).json({ success: false, message: 'Invalid or revoked device token' });
        }

        const deviceToken = account.DeviceTokens.find(
            (t) => t.TokenHash === tokenHash && !t.RevokedAt
        );

        // Best-effort: bump LastUsedAt. We don't await this or fail the request
        // if it errors — it's purely for UX (showing "last seen" in device list).
        deviceToken.LastUsedAt = new Date();
        account.save().catch((err) => {
            console.warn('[auth] Failed to bump device LastUsedAt:', err.message);
        });

        req.account = account;
        req.deviceToken = deviceToken;
        next();
    } catch (err) {
        console.error('[auth] Device token lookup failed:', err);
        return res.status(500).json({ success: false, message: 'Auth check failed' });
    }
}

module.exports = {
    requireFirebaseAuth,
    requireDeviceToken,
    hashToken,
};
