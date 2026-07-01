var CharacterMoves = require('../models/character-moves');
var Characters = require('../models/characters');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeObjectId(val) {
  try { return new ObjectId(String(val)); } catch (e) { return null; }
}

async function resolveCharacterId(value) {
  if (!value) return null;
  const oid = safeObjectId(value);
  if (oid) return oid;
  const found = await Characters.findOne({
    Slug: new RegExp('^' + String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
  }).lean();
  return found ? found._id : null;
}

// GET /character-moves/games
// Returns the distinct game IDs that have at least one character with scraped moves.
async function getGamesWithMoves(req, res) {
  try {
    const characterIds = await CharacterMoves.distinct('CharacterId');
    const characters = await Characters.find(
      { _id: { $in: characterIds } },
      { GameId: 1 }
    ).lean();
    const gameIds = [...new Set(
      characters.map((c) => c.GameId && c.GameId.toString()).filter(Boolean)
    )];
    res.json({ gameIds });
  } catch (err) {
    console.error('[character-moves] getGamesWithMoves', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /character-moves/:characterId
// GET /characterMoves/:characterId  (backward-compat alias)
async function getMovesForCharacter(req, res) {
  try {
    const characterId = await resolveCharacterId(req.params.characterId || req.params.id);
    if (!characterId) {
      return res.status(404).json({ error: 'Character not found' });
    }
    const moves = await CharacterMoves
      .find({ CharacterId: characterId })
      .sort({ DisplayOrder: 1, MoveName: 1 })
      .lean();
    res.json(moves);
  } catch (err) {
    console.error('[character-moves] getMovesForCharacter', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /character-moves/bulk
// Body: { characterId, moves: [{ moveName, imageUrl, slug?, wikiSourceUrl?, displayOrder? }] }
// Admin / scraper endpoint — upserts by (CharacterId + Slug) or (CharacterId + MoveName slug).
async function bulkUpsertMoves(req, res) {
  try {
    const characterId = await resolveCharacterId(req.body.characterId);
    if (!characterId) {
      return res.status(400).json({ error: 'Invalid or missing characterId' });
    }

    const moves = req.body.moves;
    if (!Array.isArray(moves) || moves.length === 0) {
      return res.status(400).json({ error: 'moves must be a non-empty array' });
    }

    const ops = moves.map((m) => {
      const slug = m.slug || slugify(m.moveName || '');
      const filter = { CharacterId: characterId, Slug: slug };
      const update = {
        $set: {
          CharacterId: characterId,
          MoveName: m.moveName,
          Slug: slug,
          ...(m.imageUrl !== undefined && { ImageUrl: m.imageUrl }),
          ...(m.wikiSourceUrl !== undefined && { WikiSourceUrl: m.wikiSourceUrl }),
          ...(m.displayOrder !== undefined && { DisplayOrder: m.displayOrder }),
        },
        $setOnInsert: { createdAt: new Date() },
      };
      return { updateOne: { filter, update, upsert: true } };
    });

    const result = await CharacterMoves.bulkWrite(ops);
    res.json({
      matched: result.matchedCount,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error('[character-moves] bulkUpsertMoves', err);
    res.status(500).json({ error: err.message });
  }
}

// DELETE /character-moves/:id  (admin cleanup)
async function deleteMove(req, res) {
  try {
    const oid = safeObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid id' });
    await CharacterMoves.findByIdAndDelete(oid);
    res.json({ success: true });
  } catch (err) {
    console.error('[character-moves] deleteMove', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMovesForCharacter, bulkUpsertMoves, deleteMove, getGamesWithMoves };
