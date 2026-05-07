/**
 * prerender.js
 *
 * Intercepts requests from social media crawlers (Discord, Twitter/X, Facebook,
 * Slack, etc.) and returns a minimal HTML page with the correct Open Graph and
 * Twitter Card meta tags + a <meta http-equiv="refresh"> to redirect human
 * visitors back to the Vue SPA.
 *
 * Covered routes:
 *   /match/:id          → VideoObject card  (og:type = video.other)
 *   /player/:id         → Profile card      (og:type = profile)
 *   /p/:slug            → Profile card (slug-based, canonical = /p/:slug)
 *   /character/:id      → website card
 *   /tournament/:id     → website card
 */

const { ObjectId } = require('mongodb');
const Match      = require('../models/matches');
const Player     = require('../models/players');
const Character  = require('../models/characters');
const Tournament = require('../models/tournaments');

// ── Bot user-agent detection ─────────────────────────────────────────────────
const BOT_UA_RE = /discordbot|twitterbot|facebookexternalhit|linkedinbot|slackbot|telegrambot|whatsapp|pinterest|redditbot|googlebot|bingbot|applebot|vkshare|w3c_validator/i;

function isBot(req) {
    const ua = req.headers['user-agent'] || '';
    return BOT_UA_RE.test(ua);
}

// ── Config ───────────────────────────────────────────────────────────────────
const API_URL        = process.env.API_URL  || 'https://fighters-edge.com/api';
const SITE_URL       = process.env.SITE_URL || 'https://fighters-edge.com';
const FALLBACK_IMAGE = `${SITE_URL}/img/og-banner.png`;

// ── Utility: extract YouTube video ID from a URL or bare ID ─────────────────
function youtubeId(raw) {
    if (!raw) return null;
    // Already a bare ID (11 chars, no slashes)
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
        const url = new URL(raw);
        return url.searchParams.get('v') || url.pathname.split('/').pop() || null;
    } catch {
        return null;
    }
}

// ── HTML template ────────────────────────────────────────────────────────────
function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * @param {object} opts
 * @param {string}  opts.title
 * @param {string}  [opts.description]
 * @param {string}  opts.imageUrl
 * @param {string}  opts.pageUrl
 * @param {string}  [opts.ogType]       default 'website'
 * @param {string}  [opts.twitterCard]  default 'summary_large_image'
 * @param {string}  [opts.imageAlt]     alt text for twitter:image:alt
 */
function buildHtml({ title, description, imageUrl, pageUrl, ogType, twitterCard, imageAlt }) {
    const safeTitle = esc(title);
    const safeDesc  = esc(description || '');
    const safeImg   = esc(imageUrl);
    const safeUrl   = esc(pageUrl);
    const safeAlt   = esc(imageAlt || title);
    const type      = esc(ogType    || 'website');
    const card      = esc(twitterCard || 'summary_large_image');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical"    href="${safeUrl}" />

  <!-- Open Graph -->
  <meta property="og:type"         content="${type}" />
  <meta property="og:site_name"    content="Fighters Edge" />
  <meta property="og:title"        content="${safeTitle}" />
  <meta property="og:description"  content="${safeDesc}" />
  <meta property="og:image"        content="${safeImg}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="${safeAlt}" />
  <meta property="og:url"          content="${safeUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="${card}" />
  <meta name="twitter:site"        content="@fightersedgefgc" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${safeImg}" />
  <meta name="twitter:image:alt"   content="${safeAlt}" />

  <meta http-equiv="refresh" content="0; url=${safeUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">Fighters Edge</a>…</p>
</body>
</html>`;
}

function sendHtml(res, meta) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 10 minutes for dynamic content; CDN/Cloudflare can cache longer via s-maxage
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600');
    res.send(buildHtml(meta));
}

// ── Data fetchers ────────────────────────────────────────────────────────────

async function fetchMatchMeta(id) {
    const [m] = await Match.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $lookup: { from: 'players',    localField: 'Team1Players.Id',           foreignField: '_id', as: 'T1P' } },
        { $lookup: { from: 'players',    localField: 'Team2Players.Id',           foreignField: '_id', as: 'T2P' } },
        { $lookup: { from: 'characters', localField: 'Team1Players.CharacterIds', foreignField: '_id', as: 'T1C' } },
        { $lookup: { from: 'characters', localField: 'Team2Players.CharacterIds', foreignField: '_id', as: 'T2C' } },
        { $lookup: { from: 'games',      localField: 'GameId',                    foreignField: '_id', as: 'G'   } },
    ]);
    if (!m) return null;

    const p1      = m.T1P[0]?.Name || 'Player 1';
    const p2      = m.T2P[0]?.Name || 'Player 2';
    const c1      = m.T1C[0]?.Name || '';
    const c2      = m.T2C[0]?.Name || '';
    const game    = m.G[0]?.Title  || 'Fighting Game';
    const charStr = (c1 || c2) ? ` (${[c1, c2].filter(Boolean).join(' vs ')})` : '';

    const title       = `${p1} vs ${p2} — ${game} | Fighters Edge`;
    const description = `Watch ${p1} vs ${p2}${charStr} in ${game} on Fighters Edge. Free tournament footage.`;

    return {
        title,
        description,
        imageUrl:   `${API_URL}/og/match/${id}`,
        pageUrl:    `${SITE_URL}/match/${id}`,
        ogType:     'video.other',
        twitterCard: 'summary_large_image',
        imageAlt:   `${p1} vs ${p2} match card`,
    };
}

async function fetchPlayerMeta(id, slugUrl) {
    const player = await Player.findById(new ObjectId(id));
    if (!player) return null;

    const matchCount = await Match.countDocuments({
        $or: [{ 'Team1Players.Id': new ObjectId(id) }, { 'Team2Players.Id': new ObjectId(id) }],
    });

    const title = `${player.Name} — Player Profile | Fighters Edge`;
    const description = `${player.Name} has ${matchCount.toLocaleString()} matches indexed on Fighters Edge. Watch tournament sets, study matchups, and follow their results.`;

    return {
        title,
        description,
        imageUrl:   `${API_URL}/og/player/${id}`,
        // If we arrived via /p/:slug, keep the slug as the canonical URL
        pageUrl:    slugUrl || `${SITE_URL}/player/${id}`,
        ogType:     'profile',
        twitterCard: 'summary_large_image',
        imageAlt:   `${player.Name} player profile`,
    };
}

async function fetchPlayerMetaBySlug(slug) {
    const player = await Player.findOne({ Slug: slug });
    if (!player) return null;
    return fetchPlayerMeta(player._id.toString(), `${SITE_URL}/p/${slug}`);
}

async function fetchCharacterMeta(id) {
    const [c] = await Character.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $lookup: { from: 'games', localField: 'GameId', foreignField: '_id', as: 'Game' } },
    ]);
    if (!c) return null;

    const game  = c.Game[0]?.Title || 'Fighting Game';
    const title = `${c.Name} — ${game} | Fighters Edge`;
    return {
        title,
        description: `Browse ${c.Name} tournament matches and pro-player sets in ${game} on Fighters Edge.${c.Archetype ? ` Archetype: ${c.Archetype}.` : ''}`,
        imageUrl:   `${API_URL}/og/character/${id}`,
        pageUrl:    `${SITE_URL}/character/${id}`,
        ogType:     'website',
        imageAlt:   `${c.Name} character card`,
    };
}

async function fetchTournamentMeta(id) {
    const [t] = await Tournament.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $lookup: { from: 'games', localField: 'Games', foreignField: '_id', as: 'GameList' } },
    ]);
    if (!t) return null;

    const games   = (t.GameList || []).map((g) => g.Title).filter(Boolean);
    const dateStr = t.EventDate
        ? new Date(t.EventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const title = `${t.Name} | Fighters Edge`;
    return {
        title,
        description: `${t.Name}${dateStr ? ` · ${dateStr}` : ''}${games.length ? ` · ${games.join(', ')}` : ''} — Full bracket & VOD index on Fighters Edge.`,
        imageUrl:   `${API_URL}/og/tournament/${id}`,
        pageUrl:    `${SITE_URL}/tournament/${id}`,
        ogType:     'website',
        imageAlt:   `${t.Name} tournament card`,
    };
}

// ── Route pattern → fetcher map ──────────────────────────────────────────────
const ROUTES = [
    { re: /^\/match\/([a-f0-9]{24})(?:\/|$)/i,      fetch: (id)   => fetchMatchMeta(id)            },
    { re: /^\/player\/([a-f0-9]{24})(?:\/|$)/i,     fetch: (id)   => fetchPlayerMeta(id)           },
    { re: /^\/p\/([^/]+)(?:\/|$)/,                   fetch: (slug) => fetchPlayerMetaBySlug(slug)   },
    { re: /^\/character\/([a-f0-9]{24})(?:\/|$)/i,  fetch: (id)   => fetchCharacterMeta(id)        },
    { re: /^\/tournament\/([a-f0-9]{24})(?:\/|$)/i, fetch: (id)   => fetchTournamentMeta(id)       },
];

// ── Middleware ────────────────────────────────────────────────────────────────
async function prerenderMiddleware(req, res, next) {
    if (req.method !== 'GET' || !isBot(req)) return next();

    const path = req.path;

    for (const { re, fetch: fetchMeta } of ROUTES) {
        const match = path.match(re);
        if (!match) continue;

        const param = match[1];
        try {
            const meta = await fetchMeta(param);
            if (meta) return sendHtml(res, meta);
        } catch (err) {
            console.error('[prerender] error for', path, err.message);
        }

        // Fallback: return the generic banner so bots still get some preview
        return sendHtml(res, {
            title:       'Fighters Edge — Find any matchup, instantly',
            description: 'The search engine for fighting game footage. Free, forever.',
            imageUrl:    FALLBACK_IMAGE,
            pageUrl:     `${SITE_URL}${path}`,
            imageAlt:    'Fighters Edge',
        });
    }

    next();
}

module.exports = prerenderMiddleware;
