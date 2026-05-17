// Controller for the FightersEdge AutoStream desktop app.
//
// All routes here are gated by requireDeviceToken (see routes/autostream.js),
// so `req.account` is always the authenticated Account doc. We never trust
// ContentCreatorId / SubmittedBy / UpdatedBy from the request body — those
// are derived from req.account.
//
// Endpoints:
//   POST /autostream/video  → create a Videos doc for an uploaded YouTube clip
//   POST /autostream/match  → create a Matches doc tied to that VideoUrl
//
// Both endpoints are intentionally narrow: they only accept the fields the
// desktop app actually needs, and they reuse the same Mongoose models / service
// helpers as the existing site-facing endpoints to stay in lockstep with
// schema changes.

var Match = require('../models/matches');
var Accounts = require('../models/accounts');
var ObjectId = require('mongodb').ObjectId;

function safeObjectId(value) {
    if (!value || value === 'null' || value === 'undefined' || value === '') {
        return null;
    }
    try {
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
            return ObjectId(value);
        }
        return null;
    } catch (err) {
        return null;
    }
}

// POST /autostream/video
// Body: { Url, GameId, VideoType?, StartTime?, Tags? }
// Previously created a Video document; now just validates and echoes the URL back
// so the desktop client can continue to the match-create step unchanged.
async function createVideo(req, res) {
    try {
        const Url = req.body && req.body.Url;
        const GameId = safeObjectId(req.body && req.body.GameId);

        if (!Url || !GameId) {
            return res.status(400).send({
                success: false,
                message: 'Url and GameId are required',
            });
        }

        return res.send({
            success: true,
            url: Url,
        });
    } catch (error) {
        console.error('[autostream] createVideo failed:', error);
        return res.status(500).send({
            success: false,
            message: 'Failed to create video',
            error: error && error.message ? error.message : String(error),
        });
    }
}

// POST /autostream/match
// Body: {
//   VideoUrl: string,                 // the YouTube URL created via /autostream/video
//   GameId: ObjectId-string,
//   GameVersion?: number,
//   Team1Players: [{ Slot, Id, CharacterIds: [string] }],
//   Team2Players: [{ Slot, Id, CharacterIds: [string] }],
//   WinningPlayersId?: [string],
//   LosingPlayersId?: [string],
//   StartTime?: string,               // offset inside the video, e.g. "00:01:23"
//   EndTime?: string,
//   SetId?: ObjectId-string,          // groups matches into a set; the desktop
//                                     // app mints one ObjectId per set
//   Tags?: any[]
// }
function createMatch(req, res) {
    try {
        const VideoUrl = req.body && req.body.VideoUrl;
        const GameId = safeObjectId(req.body && req.body.GameId);

        if (!VideoUrl || !GameId) {
            return res.status(400).send({
                success: false,
                message: 'VideoUrl and GameId are required',
            });
        }

        if (!Array.isArray(req.body.Team1Players) || !Array.isArray(req.body.Team2Players)) {
            return res.status(400).send({
                success: false,
                message: 'Team1Players and Team2Players arrays are required',
            });
        }

        // Map players + characters defensively. We accept two shapes for
        // CharacterIds — the legacy site shape `[{ id }]` and a flat
        // `["<oid>"]` because the desktop app sends the flat form.
        function mapPlayer(player) {
            const id = safeObjectId(player && player.Id);
            const characterIds = Array.isArray(player && player.CharacterIds)
                ? player.CharacterIds.map((c) => {
                      if (c && typeof c === 'object' && c.id) return safeObjectId(c.id);
                      return safeObjectId(c);
                  }).filter(Boolean)
                : [];
            return {
                Slot: player && typeof player.Slot === 'number' ? player.Slot : undefined,
                Id: id,
                CharacterIds: characterIds,
            };
        }

        const team1 = req.body.Team1Players.map(mapPlayer);
        const team2 = req.body.Team2Players.map(mapPlayer);

        if (team1.some((p) => !p.Id) || team2.some((p) => !p.Id)) {
            return res.status(400).send({
                success: false,
                message: 'Every player must have a valid Id',
            });
        }

        const winningIds = Array.isArray(req.body.WinningPlayersId)
            ? req.body.WinningPlayersId.map(safeObjectId).filter(Boolean)
            : null;
        const losingIds = Array.isArray(req.body.LosingPlayersId)
            ? req.body.LosingPlayersId.map(safeObjectId).filter(Boolean)
            : null;

        const SetId = safeObjectId(req.body.SetId);
        const submittedBy = req.account ? req.account._id : null;

        const newMatch = new Match({
            Team1Players: team1,
            Team2Players: team2,
            VideoUrl: VideoUrl,
            GameId: GameId,
            GameVersion: typeof req.body.GameVersion === 'number' ? req.body.GameVersion : undefined,
            WinningPlayersId: winningIds,
            LosingPlayersId: losingIds,
            StartTime: req.body.StartTime || null,
            EndTime: req.body.EndTime || null,
            SetId: SetId || undefined,
            SubmittedBy: submittedBy,
            UpdatedBy: submittedBy,
            Tags: Array.isArray(req.body.Tags) ? req.body.Tags : [],
        });

        newMatch.save(function (error, match) {
            if (error) {
                console.error('[autostream] createMatch save failed:', error);
                return res.status(500).send({
                    success: false,
                    message: 'Failed to save match',
                    error: error.message,
                });
            }
            return res.send({
                success: true,
                message: 'Match saved successfully',
                match: match,
            });
        });
    } catch (error) {
        console.error('[autostream] createMatch failed:', error);
        return res.status(500).send({
            success: false,
            message: 'Failed to create match',
            error: error && error.message ? error.message : String(error),
        });
    }
}

module.exports = {
    createVideo,
    createMatch,
};
