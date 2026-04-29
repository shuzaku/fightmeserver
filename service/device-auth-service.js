// Business logic for device authentication — issuing, listing, and
// revoking long-lived tokens that let external apps authenticate as
// a FightersEdge user.

const crypto = require('crypto');
const Accounts = require('../models/accounts');
const { hashToken } = require('../utils/auth-middleware');

// A device token is 32 random bytes, base64url-encoded → ~43 chars.
// We prefix it with "fe_" so it's self-describing when leaked in logs.
function generatePlainToken() {
    return 'fe_' + crypto.randomBytes(32).toString('base64url');
}

// Issue a new device token for the account matching the given Firebase UID.
// Returns the plaintext token ONCE — after this, only the hash is stored.
async function authorizeDevice({ firebaseUid, email, displayName, deviceName }) {
    // The Vue app's accounts are keyed by Firebase UID. If the user hasn't
    // created an Account doc yet (edge case for new signups), we auto-create
    // one using the Firebase identity — matches the existing addAccount flow.
    let account = await Accounts.findOne({ Uid: firebaseUid });

    if (!account) {
        account = new Accounts({
            Uid: firebaseUid,
            Email: email || 'unknown@fighters-edge.com',
            DisplayName: displayName || email || 'FightersEdge User',
            AccountType: 'user',
            FavoriteVideos: [],
            FollowedPlayers: [],
            FollowedCharacters: [],
            Collections: [],
            DeviceTokens: [],
        });
    }

    const plainToken = generatePlainToken();
    const tokenHash = hashToken(plainToken);

    account.DeviceTokens.push({
        TokenHash: tokenHash,
        DeviceName: (deviceName || 'Unnamed device').slice(0, 100),
        LastUsedAt: null,
        RevokedAt: null,
    });

    await account.save();

    // Return the subdoc ID so callers can reference it for later revocation.
    const created = account.DeviceTokens[account.DeviceTokens.length - 1];

    return {
        token: plainToken,
        tokenId: created._id.toString(),
        accountId: account._id.toString(),
    };
}

// List tokens for the account matching this Firebase UID.
// Does NOT return the hash or the plaintext — just the metadata users need
// to recognise/revoke devices.
async function listDevices(firebaseUid) {
    const account = await Accounts.findOne({ Uid: firebaseUid });
    if (!account) return { devices: [] };

    const devices = (account.DeviceTokens || [])
        .filter((t) => !t.RevokedAt)
        .map((t) => ({
            id: t._id.toString(),
            deviceName: t.DeviceName,
            createdAt: t.createdAt,
            lastUsedAt: t.LastUsedAt,
        }));

    return { devices };
}

async function revokeDevice(firebaseUid, tokenId) {
    const account = await Accounts.findOne({ Uid: firebaseUid });
    if (!account) throw new Error('Account not found');

    const subdoc = account.DeviceTokens.id(tokenId);
    if (!subdoc) throw new Error('Device token not found');

    subdoc.RevokedAt = new Date();
    await account.save();
    return { success: true };
}

// Called by the desktop app after it has a device token. Returns everything
// the app needs to hydrate its UI: account info + linked Player (if any).
async function getSession(account) {
    // account is the Mongo doc attached by requireDeviceToken middleware.
    // We populate LinkedPlayerId in a separate call to keep things explicit.
    const populated = await Accounts.findById(account._id).populate(
        'LinkedPlayerId',
        'Name Slug ImageUrl'
    );

    const linkedPlayer = populated && populated.LinkedPlayerId
        ? {
            id: populated.LinkedPlayerId._id.toString(),
            name: populated.LinkedPlayerId.Name,
            slug: populated.LinkedPlayerId.Slug,
            imageUrl: populated.LinkedPlayerId.ImageUrl,
        }
        : null;

    return {
        account: {
            id: account._id.toString(),
            displayName: account.DisplayName,
            email: account.Email,
            accountType: account.AccountType,
        },
        linkedPlayer,
    };
}

async function linkPlayer(firebaseUid, playerId) {
    const account = await Accounts.findOne({ Uid: firebaseUid });
    if (!account) throw new Error('Account not found');

    account.LinkedPlayerId = playerId || null;
    await account.save();
    return { success: true, linkedPlayerId: playerId || null };
}

module.exports = {
    authorizeDevice,
    listDevices,
    revokeDevice,
    getSession,
    linkPlayer,
};
