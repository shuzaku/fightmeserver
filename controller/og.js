const { Resvg } = require('@resvg/resvg-js');
const Match = require('../models/matches');
const Player = require('../models/players');
const Character = require('../models/characters');
const Tournament = require('../models/tournaments');
const { ObjectId } = require('mongodb');
const https = require('https');

// ── Lazy cache ──────────────────────────────────────────────────────────────
const _cache = { satori: null, fontBold: null, fontRegular: null };

async function loadSatori() {
    if (!_cache.satori) {
        _cache.satori = (await import('satori')).default;
    }
    return _cache.satori;
}

function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function loadFonts() {
    if (!_cache.fontBold) {
        [_cache.fontBold, _cache.fontRegular] = await Promise.all([
            fetchBuffer('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff'),
            fetchBuffer('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff'),
        ]);
    }
}

async function toPng(element) {
    const [satori] = await Promise.all([loadSatori(), loadFonts()]);
    const svg = await satori(element, {
        width: 1200,
        height: 630,
        fonts: [
            { name: 'Roboto', data: _cache.fontBold,    weight: 700, style: 'normal' },
            { name: 'Roboto', data: _cache.fontRegular, weight: 400, style: 'normal' },
        ],
    });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    return resvg.render().asPng();
}

function sendPng(res, png) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(png);
}

// ── Layout helpers ───────────────────────────────────────────────────────────
const el = (type, style, children) => ({ type, props: { style, children } });
const div = (style, children) => el('div', style, children);
const span = (style, text) => el('div', { ...style, display: 'flex' }, text);
const img = (src, w, h, style = {}) => ({ type: 'img', props: { src, width: w, height: h, style } });

const DARK     = '#13151f';
const DARK2    = '#1a1d2e';
const GREEN    = '#3eb489';
const WHITE    = '#ffffff';
const WHITE60  = 'rgba(255,255,255,0.6)';
const WHITE30  = 'rgba(255,255,255,0.3)';

function card(children) {
    return div({
        width: '1200px',
        height: '630px',
        background: DARK,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Roboto',
    }, [
        // Green top bar
        div({ width: '1200px', height: '4px', background: GREEN }, []),
        // Content area
        div({
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '48px 64px 44px',
        }, children),
    ]);
}

function brand(subtitle) {
    return div({ display: 'flex', alignItems: 'center', marginBottom: '36px' }, [
        span({ fontSize: '16px', fontWeight: 700, color: GREEN, letterSpacing: '3px' }, 'FIGHTERS EDGE'),
        subtitle ? span({ fontSize: '16px', color: WHITE30, marginLeft: '12px', marginRight: '12px' }, '·') : null,
        subtitle ? span({ fontSize: '16px', color: WHITE60, fontWeight: 400 }, subtitle) : null,
    ].filter(Boolean));
}

function footer(rightLabel) {
    return div({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }, [
        span({ fontSize: '15px', color: WHITE30 }, 'fighters-edge.com'),
        div({
            display: 'flex',
            fontSize: '14px',
            color: GREEN,
            background: 'rgba(62,180,137,0.12)',
            padding: '8px 18px',
            borderRadius: '20px',
        }, rightLabel || 'View on Fighters Edge →'),
    ]);
}

function avatar(url, size, borderColor) {
    const style = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `3px solid ${borderColor || 'rgba(255,255,255,0.2)'}`,
    };
    if (url) return img(url, size, size, style);
    return div({ ...style, background: DARK2, display: 'flex', alignItems: 'center', justifyContent: 'center' }, [
        span({ fontSize: `${Math.floor(size / 2.5)}px`, color: WHITE30 }, '?'),
    ]);
}

// ── Match OG ─────────────────────────────────────────────────────────────────
async function matchOg(req, res) {
    try {
        const id = new ObjectId(req.params.id);
        const [m] = await Match.aggregate([
            { $match: { _id: id } },
            { $lookup: { from: 'players',    localField: 'Team1Players.Id',           foreignField: '_id', as: 'Team1Player' } },
            { $lookup: { from: 'players',    localField: 'Team2Players.Id',           foreignField: '_id', as: 'Team2Player' } },
            { $lookup: { from: 'characters', localField: 'Team1Players.CharacterIds', foreignField: '_id', as: 'Team1Chars'  } },
            { $lookup: { from: 'characters', localField: 'Team2Players.CharacterIds', foreignField: '_id', as: 'Team2Chars'  } },
            { $lookup: { from: 'games',      localField: 'GameId',                    foreignField: '_id', as: 'Game'        } },
        ]);

        if (!m) return res.status(404).send('Match not found');

        const p1    = m.Team1Player[0]?.Name  || 'Player 1';
        const p2    = m.Team2Player[0]?.Name  || 'Player 2';
        const c1    = m.Team1Chars[0]?.Name   || '';
        const c2    = m.Team2Chars[0]?.Name   || '';
        const c1img = m.Team1Chars[0]?.AvatarUrl || null;
        const c2img = m.Team2Chars[0]?.AvatarUrl || null;
        const game  = m.Game[0]?.Title || 'Fighting Game';

        function playerCol(name, charName, avatarUrl, accentColor) {
            return div({ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '320px' }, [
                avatar(avatarUrl, 130, accentColor),
                div({ marginTop: '16px', fontSize: '30px', fontWeight: 700, color: WHITE, textAlign: 'center', maxWidth: '280px' }, name),
                charName ? div({ marginTop: '6px', fontSize: '18px', fontWeight: 400, color: WHITE60, textAlign: 'center' }, charName) : null,
            ].filter(Boolean));
        }

        const element = card([
            brand(game),
            div({ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }, [
                playerCol(p1, c1, c1img, 'rgba(62,180,137,0.7)'),
                div({ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px' }, [
                    span({ fontSize: '58px', fontWeight: 700, color: 'rgba(255,255,255,0.12)', lineHeight: '1' }, 'VS'),
                ]),
                playerCol(p2, c2, c2img, 'rgba(255,255,255,0.25)'),
            ]),
            footer('Watch the match →'),
        ]);

        const png = await toPng(element);
        sendPng(res, png);
    } catch (err) {
        console.error('[OG] match error:', err.message);
        res.status(500).send('Error generating match image');
    }
}

// ── Player OG ────────────────────────────────────────────────────────────────
async function playerOg(req, res) {
    try {
        const id = new ObjectId(req.params.id);
        const player = await Player.findById(id);
        if (!player) return res.status(404).send('Player not found');

        const matchCount = await Match.countDocuments({
            $or: [{ 'Team1Players.Id': id }, { 'Team2Players.Id': id }],
        });

        const element = card([
            brand('Player Profile'),
            div({ display: 'flex', flex: 1, alignItems: 'center', gap: '52px' }, [
                avatar(player.ImageUrl, 160, 'rgba(62,180,137,0.6)'),
                div({ display: 'flex', flexDirection: 'column' }, [
                    div({ fontSize: '52px', fontWeight: 700, color: WHITE, lineHeight: '1.1', maxWidth: '680px' }, player.Name),
                    div({ marginTop: '16px', fontSize: '22px', fontWeight: 400, color: WHITE60 }, `${matchCount.toLocaleString()} matches indexed`),
                    div({ marginTop: '24px', display: 'flex' }, [
                        div({
                            fontSize: '14px',
                            fontWeight: 700,
                            color: GREEN,
                            background: 'rgba(62,180,137,0.12)',
                            padding: '8px 18px',
                            borderRadius: '6px',
                        }, 'PRO PLAYER'),
                    ]),
                ]),
            ]),
            footer('View player profile →'),
        ]);

        const png = await toPng(element);
        sendPng(res, png);
    } catch (err) {
        console.error('[OG] player error:', err.message);
        res.status(500).send('Error generating player image');
    }
}

// ── Character OG ─────────────────────────────────────────────────────────────
async function characterOg(req, res) {
    try {
        const id = new ObjectId(req.params.id);
        const [character] = await Character.aggregate([
            { $match: { _id: id } },
            { $lookup: { from: 'games', localField: 'GameId', foreignField: '_id', as: 'Game' } },
        ]);

        if (!character) return res.status(404).send('Character not found');

        const game = character.Game[0]?.Title || 'Fighting Game';

        const element = card([
            brand(game),
            div({ display: 'flex', flex: 1, alignItems: 'center', gap: '64px' }, [
                character.ImageUrl
                    ? img(character.ImageUrl, 280, 320, { objectFit: 'contain', objectPosition: 'bottom' })
                    : div({ width: '280px', height: '320px', background: DARK2, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, [
                        span({ fontSize: '80px', color: WHITE30 }, '?'),
                    ]),
                div({ display: 'flex', flexDirection: 'column' }, [
                    div({ fontSize: '16px', fontWeight: 400, color: GREEN, letterSpacing: '2px', marginBottom: '12px' }, 'CHARACTER'),
                    div({ fontSize: '58px', fontWeight: 700, color: WHITE, lineHeight: '1.05', maxWidth: '580px' }, character.Name),
                    character.Archetype ? div({ marginTop: '16px', fontSize: '22px', fontWeight: 400, color: WHITE60 }, character.Archetype) : null,
                ].filter(Boolean)),
            ]),
            footer('Browse matches →'),
        ]);

        const png = await toPng(element);
        sendPng(res, png);
    } catch (err) {
        console.error('[OG] character error:', err.message);
        res.status(500).send('Error generating character image');
    }
}

// ── Tournament OG ─────────────────────────────────────────────────────────────
async function tournamentOg(req, res) {
    try {
        const id = new ObjectId(req.params.id);
        const [tournament] = await Tournament.aggregate([
            { $match: { _id: id } },
            { $lookup: { from: 'games', localField: 'Games', foreignField: '_id', as: 'GameList' } },
        ]);

        if (!tournament) return res.status(404).send('Tournament not found');

        const games = (tournament.GameList || []).map((g) => g.Title).filter(Boolean);
        const dateStr = tournament.EventDate
            ? new Date(tournament.EventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null;

        const element = card([
            brand('Tournament'),
            div({ display: 'flex', flex: 1, alignItems: 'center' }, [
                div({ display: 'flex', flexDirection: 'column', flex: 1 }, [
                    div({ fontSize: '16px', fontWeight: 400, color: GREEN, letterSpacing: '2px', marginBottom: '16px' }, 'TOURNAMENT'),
                    div({ fontSize: '52px', fontWeight: 700, color: WHITE, lineHeight: '1.1', maxWidth: '900px' }, tournament.Name),
                    dateStr ? div({ marginTop: '20px', fontSize: '22px', fontWeight: 400, color: WHITE60 }, dateStr) : null,
                    games.length > 0 ? div({ display: 'flex', marginTop: '20px', gap: '10px' }, games.slice(0, 4).map((g) =>
                        div({
                            display: 'flex',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: WHITE60,
                            background: 'rgba(255,255,255,0.08)',
                            padding: '6px 14px',
                            borderRadius: '6px',
                        }, g)
                    )) : null,
                ].filter(Boolean)),
            ]),
            footer('View bracket & matches →'),
        ]);

        const png = await toPng(element);
        sendPng(res, png);
    } catch (err) {
        console.error('[OG] tournament error:', err.message);
        res.status(500).send('Error generating tournament image');
    }
}

// Pre-warm fonts at startup so first request is fast
loadFonts().catch((err) => console.warn('[OG] Font preload failed:', err.message));

module.exports = { matchOg, playerOg, characterOg, tournamentOg };
