/**
 * prerender.js
 *
 * Intercepts requests from social media crawlers (Discord, Twitter/X, Facebook,
 * Slack, etc.) and returns a minimal HTML page with the correct Open Graph meta
 * tags + a <meta http-equiv="refresh"> to redirect human visitors to the SPA.
 *
 * For this to work in production, fighters-edge.com must be proxied through the
 * Node server (or a Cloudflare Worker / Netlify Edge Function must forward bot
 * traffic to this server). See README for configuration options.
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
const API_URL   = process.env.API_URL   || 'https://www.fighters-edge.com/api';
const SITE_URL  = process.env.SITE_URL  || 'https://www.fighters-edge.com';
const FALLBACK_IMAGE = 'https://www.fighters-edge.com/img/og-banner.png';

// ── HTML template ────────────────────────────────────────────────────────────
function buildHtml({ title, description, imageUrl, pageUrl }) {
    const safeTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const safeDesc  = (description || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <meta property="og:type"         content="website" />
  <meta property="og:site_name"    content="Fighters Edge" />
  <meta property="og:title"        content="${safeTitle}" />
  <meta property="og:description"  content="${safeDesc}" />
  <meta property="og:image"        content="${imageUrl}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url"          content="${pageUrl}" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@fightersedgefgc" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${imageUrl}" />

  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${pageUrl}">Fighters Edge</a>…</p>
</body>
</html>`;
}

function sendHtml(res, meta) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
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

    const p1   = m.T1P[0]?.Name || 'Player 1';
    const p2   = m.T2P[0]?.Name || 'Player 2';
    const c1   = m.T1C[0]?.Name || '';
    const c2   = m.T2C[0]?.Name || '';
    const game = m.G[0]?.Title  || 'Fighting Game';
    const charStr = (c1 || c2) ? ` (${[c1, c2].filter(Boolean).join(' vs ')})` : '';

    return {
        title:       `${p1} vs ${p2} — ${game} | Fighters Edge`,
        description: `Watch ${p1} vs ${p2}${charStr} in ${game} on Fighters Edge. Free tournament footage.`,
        imageUrl:    `${API_URL}/og/match/${id}`,
        pageUrl:     `${SITE_URL}/match/${id}`,
    };
}

async function fetchPlayerMeta(id) {
    const player = await Player.findById(new ObjectId(id));
    if (!player) return null;

    const matchCount = await Match.countDocuments({
        $or: [{ 'Team1Players.Id': new ObjectId(id) }, { 'Team2Players.Id': new ObjectId(id) }],
    });

    return {
        title:       `${player.Name} — Player Profile | Fighters Edge`,
        description: `${player.Name} has ${matchCount.toLocaleString()} matches indexed on Fighters Edge. Watch tournament sets, study matchups, and follow their results.`,
        imageUrl:    `${API_URL}/og/player/${id}`,
        pageUrl:     `${SITE_URL}/player/${id}`,
    };
}

async function fetchCharacterMeta(id) {
    const [c] = await Character.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $lookup: { from: 'games', localField: 'GameId', foreignField: '_id', as: 'Game' } },
    ]);
    if (!c) return null;

    const game = c.Game[0]?.Title || 'Fighting Game';
    return {
        title:       `${c.Name} — ${game} | Fighters Edge`,
        description: `Browse ${c.Name} tournament matches and pro-player sets in ${game} on Fighters Edge.${c.Archetype ? ` Archetype: ${c.Archetype}.` : ''}`,
        imageUrl:    `${API_URL}/og/character/${id}`,
        pageUrl:     `${SITE_URL}/character/${id}`,
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

    return {
        title:       `${t.Name} | Fighters Edge`,
        description: `${t.Name}${dateStr ? ` · ${dateStr}` : ''}${games.length ? ` · ${games.join(', ')}` : ''} — Full bracket & VOD index on Fighters Edge.`,
        imageUrl:    `${API_URL}/og/tournament/${id}`,
        pageUrl:     `${SITE_URL}/tournament/${id}`,
    };
}

// ── Route pattern → fetcher map ──────────────────────────────────────────────
const ROUTES = [
    { re: /^\/match\/([a-f0-9]{24})(?:\/|$)/i,      fetch: fetchMatchMeta      },
    { re: /^\/player\/([a-f0-9]{24})(?:\/|$)/i,     fetch: fetchPlayerMeta     },
    { re: /^\/p\/([^/]+)(?:\/|$)/,                   fetch: null                }, // slug — skip for now
    { re: /^\/character\/([a-f0-9]{24})(?:\/|$)/i,  fetch: fetchCharacterMeta  },
    { re: /^\/tournament\/([a-f0-9]{24})(?:\/|$)/i, fetch: fetchTournamentMeta },
];

// ── Middleware ────────────────────────────────────────────────────────────────
async function prerenderMiddleware(req, res, next) {
    // Only intercept GET requests from known bots
    if (req.method !== 'GET' || !isBot(req)) return next();

    const path = req.path;

    for (const { re, fetch: fetchMeta } of ROUTES) {
        const match = path.match(re);
        if (!match) continue;
        if (!fetchMeta) return next(); // route matched but no fetcher → skip

        const id = match[1];
        try {
            const meta = await fetchMeta(id);
            if (meta) return sendHtml(res, meta);
        } catch (err) {
            console.error('[prerender] error for', path, err.message);
        }

        // Fallback: return generic OG card so at least some preview shows
        return sendHtml(res, {
            title:       'Fighters Edge — Find any matchup, instantly',
            description: 'The search engine for fighting game footage. Free, forever.',
            imageUrl:    FALLBACK_IMAGE,
            pageUrl:     `${SITE_URL}${path}`,
        });
    }

    next();
}

module.exports = prerenderMiddleware;
