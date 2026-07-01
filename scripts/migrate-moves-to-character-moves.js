/**
 * migrate-moves-to-character-moves.js
 *
 * One-time script that copies rows from the legacy `moves` collection
 * into the new `character-moves` collection. Run once after deploying
 * the new model; legacy rows without images are kept but ImageUrl is
 * left blank so the palette can show a text-only tile until the scraper
 * fills it in.
 *
 * Usage:
 *   node scripts/migrate-moves-to-character-moves.js
 *
 * Prerequisites: DB_USERNAME and DB_PASSWORD env vars set (or .env in project root).
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Moves = require('../models/moves');
const CharacterMoves = require('../models/character-moves');

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const { DB_USERNAME, DB_PASSWORD } = process.env;
  if (!DB_USERNAME || !DB_PASSWORD) {
    console.error('Set DB_USERNAME and DB_PASSWORD first.');
    process.exit(1);
  }

  const connStr = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
  await mongoose.connect(connStr, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  const legacyMoves = await Moves.find({}).lean();
  console.log(`Found ${legacyMoves.length} legacy moves to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const move of legacyMoves) {
    if (!move.CharacterId) { skipped++; continue; }
    const slug = slugify(move.MoveName || '');
    if (!slug) { skipped++; continue; }

    await CharacterMoves.updateOne(
      { CharacterId: move.CharacterId, Slug: slug },
      {
        $setOnInsert: {
          CharacterId: move.CharacterId,
          MoveName: move.MoveName || '',
          Slug: slug,
          ImageUrl: '',
          DisplayOrder: move.DisplayOrder || 0,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    migrated++;
  }

  console.log(`Migration complete. Migrated: ${migrated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
