// Firebase Admin SDK initialisation.
//
// We use Firebase Admin to *verify* ID tokens that the Vue web app sends us
// when a signed-in user wants to authorise a desktop device. Admin SDK does
// this offline (caches Google's public keys), so no extra network calls
// happen per request.
//
// Credentials are loaded from one of:
//   1. GOOGLE_APPLICATION_CREDENTIALS env var (path to a service-account JSON) — standard Google pattern
//   2. FIREBASE_SERVICE_ACCOUNT env var (the JSON contents inline) — useful on Heroku / CI
//   3. Application default credentials (works locally after `gcloud auth
//      application-default login`, and on Google hosting automatically)
//
// If none of the above are available we log a warning and expose a stub that
// rejects — so the app can still boot for endpoints that don't need Firebase,
// but device-auth endpoints will cleanly 500 instead of crashing the process.

const admin = require('firebase-admin');

let initialised = false;
let initError = null;

function init() {
    if (initialised || initError) return;

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Heroku-style: the entire service account JSON stuffed into one env var
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // GOOGLE_APPLICATION_CREDENTIALS points at a file on disk — Admin
            // SDK reads it automatically via applicationDefault()
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        } else {
            // Last-ditch: try application default (works on GCP hosting)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
        initialised = true;
        console.log('[firebase-admin] Initialised');
    } catch (err) {
        initError = err;
        console.error(
            '[firebase-admin] Failed to initialise — device-auth endpoints will not work. ' +
            'Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path) in env.',
            err.message
        );
    }
}

init();

async function verifyIdToken(idToken) {
    if (!initialised) {
        throw new Error(
            'Firebase Admin SDK not initialised — cannot verify ID token. ' +
            'Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS in env.'
        );
    }
    return admin.auth().verifyIdToken(idToken);
}

module.exports = {
    verifyIdToken,
    isInitialised: () => initialised,
};
