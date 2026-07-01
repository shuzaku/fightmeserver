/**
 * Reassign tournament-matches from one tournament to another.
 *
 * Usage (dry run — count only):
 *   node scripts/reassign-tournament-matches.js
 *
 * Apply update:
 *   node scripts/reassign-tournament-matches.js --execute
 *
 * Requires DB_USERNAME and DB_PASSWORD in .env (project root).
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const TournamentMatches = require('../models/tournament-matches');

const FROM_TOURNAMENT_ID = '69f65ce0abd1b494b879b2b0';
const TO_TOURNAMENT_ID = '6a415d9650d3f411784e0fd9';
const CREATED_AFTER = new Date('2026-06-29T00:00:00.000Z');

const filter = {
  TournamentId: new mongoose.Types.ObjectId(FROM_TOURNAMENT_ID),
  createdAt: { $gt: CREATED_AFTER },
};

async function run() {
  const { DB_USERNAME, DB_PASSWORD } = process.env;
  if (!DB_USERNAME || !DB_PASSWORD) {
    console.error('Set DB_USERNAME and DB_PASSWORD in .env first.');
    process.exit(1);
  }

  const execute = process.argv.includes('--execute');
  const connStr = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;

  await mongoose.connect(connStr, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  const count = await TournamentMatches.countDocuments(filter);
  console.log('Matching documents:', count);
  console.log('Filter:', JSON.stringify(filter, null, 2));

  if (!execute) {
    console.log('\nDry run only. Re-run with --execute to apply the update.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await TournamentMatches.updateMany(filter, {
    $set: { TournamentId: new mongoose.Types.ObjectId(TO_TOURNAMENT_ID) },
  });

  console.log('\nUpdate result:');
  console.log('  matchedCount:', result.matchedCount ?? result.n);
  console.log('  modifiedCount:', result.modifiedCount ?? result.nModified);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
