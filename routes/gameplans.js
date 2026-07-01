const express = require('express');
const router = express.Router();
const Gameplans = require('../models/gameplans');
const mongoose = require('mongoose');

function safeObjectId(val) {
  try { return new mongoose.Types.ObjectId(String(val)); } catch { return null; }
}

// POST /gameplans — create (auth: OwnerId required in body)
router.post('/gameplans', async (req, res) => {
  try {
    const gameplan = new Gameplans({
      Name: req.body.Name,
      CharacterId: req.body.CharacterId,
      GameId: req.body.GameId,
      OwnerId: req.body.OwnerId,
      Nodes: req.body.Nodes || [],
      Edges: req.body.Edges || [],
      Viewport: req.body.Viewport || {},
      IsPublic: req.body.IsPublic || false,
    });
    await gameplan.save();
    res.json(gameplan);
  } catch (err) {
    console.error('[gameplans] POST', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /gameplans?ownerId=&characterId=&gameId=&isPublic=true
router.get('/gameplans', async (req, res) => {
  try {
    const filter = {};
    if (req.query.ownerId) {
      const oid = safeObjectId(req.query.ownerId);
      if (oid) filter.OwnerId = oid;
    }
    if (req.query.characterId) {
      const cid = safeObjectId(req.query.characterId);
      if (cid) filter.CharacterId = cid;
    }
    if (req.query.gameId) {
      const gid = safeObjectId(req.query.gameId);
      if (gid) filter.GameId = gid;
    }
    if (req.query.isPublic === 'true') {
      filter.IsPublic = true;
    }

    const gameplans = await Gameplans.find(filter)
      .sort({ updatedAt: -1 })
      .select('-Nodes -Edges') // omit heavy fields for list view
      .lean();
    res.json(gameplans);
  } catch (err) {
    console.error('[gameplans] GET list', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /gameplans/:id — load one (owner or public)
router.get('/gameplans/:id', async (req, res) => {
  try {
    const gameplan = await Gameplans.findById(req.params.id);
    if (!gameplan) return res.status(404).json({ error: 'Not found' });
    res.json(gameplan);
  } catch (err) {
    console.error('[gameplans] GET one', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /gameplans/:id — update (owner check via OwnerId in body)
router.put('/gameplans/:id', async (req, res) => {
  try {
    const gameplan = await Gameplans.findById(req.params.id);
    if (!gameplan) return res.status(404).json({ error: 'Not found' });

    // Lightweight owner check: caller must supply matching OwnerId
    if (req.body.OwnerId && String(gameplan.OwnerId) !== String(req.body.OwnerId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = ['Name', 'Nodes', 'Edges', 'Viewport', 'IsPublic'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) gameplan[key] = req.body[key];
    });
    await gameplan.save();
    res.json(gameplan);
  } catch (err) {
    console.error('[gameplans] PUT', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /gameplans/:id
router.delete('/gameplans/:id', async (req, res) => {
  try {
    const gameplan = await Gameplans.findById(req.params.id);
    if (!gameplan) return res.status(404).json({ error: 'Not found' });

    if (req.body.OwnerId && String(gameplan.OwnerId) !== String(req.body.OwnerId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Gameplans.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[gameplans] DELETE', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
