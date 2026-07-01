#!/usr/bin/env node
/**
 * scrape-character-moves.js
 *
 * Scrapes move data from a character wiki page and bulk-upserts the results
 * into the character-moves collection via the local API.
 *
 * Usage examples:
 *   # Scrape a single character by Mongo ID
 *   node scripts/scrape-character-moves.js --characterId 64a1b2c3d4e5f678901234ab
 *
 *   # Scrape all characters for a game (by Mongo ID) that have a Wiki URL
 *   node scripts/scrape-character-moves.js --gameId 64a000000000000000000001
 *
 *   # Dry-run (parse only, don't POST to API)
 *   node scripts/scrape-character-moves.js --characterId ... --dry
 *
 * Environment:
 *   DB_USERNAME, DB_PASSWORD — MongoDB credentials (reads characters from DB directly)
 *   API_BASE — optional base URL for the local API (default: http://localhost:80/api)
 *   RATE_DELAY_MS — ms between requests (default: 1500)
 *
 * Notes:
 *   - The scraper picks the right parser based on the wiki host. Currently
 *     supports Fandom/Miraheze-style pages via scripts/parsers/fandom.js.
 *     Add a new parser in scripts/parsers/ and register it in PARSERS below.
 *   - Images are stored as absolute wiki CDN URLs. Run a separate Cloudinary
 *     upload pass if you want to host them yourself.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Characters = require('../models/characters');

// ── Parser registry ──────────────────────────────────────────────────────────
// Maps wiki host keywords to parser modules.
const PARSERS = {
  'dustloop.com':    require('./parsers/dustloop'),
  'supercombo.gg':   require('./parsers/supercombo'),
  'play2xko.com':    require('./parsers/play2xko'),
  'dreamcancel.com': require('./parsers/dreamcancel'),
  'wavu.wiki':       require('./parsers/wavu'),
  'fandom.com':      require('./parsers/fandom'),
  'miraheze.org':    require('./parsers/fandom'), // same DOM shape
};

function getParser(wikiUrl) {
  for (const [key, parser] of Object.entries(PARSERS)) {
    if (wikiUrl.includes(key)) return parser;
  }
  // Default to fandom parser as best-effort
  return require('./parsers/fandom');
}

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  argMap[args[i].replace(/^--/, '')] = args[i + 1] || true;
}

const DRY = 'dry' in argMap;
const RATE_DELAY = parseInt(process.env.RATE_DELAY_MS || '1500', 10);
const API_BASE = process.env.API_BASE || 'http://localhost:80/api';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'FightersEdge-MoveScraper/1.0 (+https://fighters-edge.com)',
    },
    timeout: 15000,
  });
  return response.data;
}

async function scrapeCharacter(character) {
  const wikiUrl = character.Wiki;
  if (!wikiUrl) {
    console.log(`  [skip] ${character.Name} — no Wiki URL`);
    return { skipped: true };
  }

  console.log(`  [fetch] ${character.Name} — ${wikiUrl}`);
  let html;
  try {
    html = await fetchHtml(wikiUrl);
  } catch (err) {
    console.error(`  [error] ${character.Name} — fetch failed: ${err.message}`);
    return { error: true };
  }

  const $ = cheerio.load(html);
  const parser = getParser(wikiUrl);
  const moves = await parser.parse($, wikiUrl);
  console.log(`  [parsed] ${moves.length} moves for ${character.Name}`);

  if (DRY || moves.length === 0) {
    if (moves.length) console.log('  [dry] would upsert', moves.slice(0, 3).map((m) => m.moveName));
    return { parsed: moves.length };
  }

  // POST to bulk endpoint
  try {
    const resp = await axios.post(
      `${API_BASE}/character-moves/bulk`,
      {
        characterId: String(character._id),
        moves: moves.map((m, i) => ({
          moveName: m.moveName,
          imageUrl: m.imageUrl,
          wikiSourceUrl: m.wikiSourceUrl,
          displayOrder: i,
        })),
      },
      { timeout: 15000 }
    );
    console.log(`  [upserted] ${resp.data.upserted} new, ${resp.data.modified} updated`);
    return { upserted: resp.data.upserted };
  } catch (err) {
    console.error(`  [error] ${character.Name} — POST failed: ${err.message}`);
    return { error: true };
  }
}

async function run() {
  const { DB_USERNAME, DB_PASSWORD } = process.env;
  if (!DB_USERNAME || !DB_PASSWORD) {
    console.error('DB_USERNAME and DB_PASSWORD env vars are required.');
    process.exit(1);
  }

  const connStr = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
  await mongoose.connect(connStr, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  let query = {};
  if (argMap.characterId) {
    query = { _id: new mongoose.Types.ObjectId(argMap.characterId) };
  } else if (argMap.gameId) {
    query = { GameId: new mongoose.Types.ObjectId(argMap.gameId), Wiki: { $exists: true, $ne: '' } };
  } else {
    query = { Wiki: { $exists: true, $ne: '' } };
  }

  const characters = await Characters.find(query).lean();
  console.log(`Scraping ${characters.length} character(s)…`);

  let done = 0, errors = 0;
  for (const char of characters) {
    const result = await scrapeCharacter(char);
    if (result.error) errors++;
    else done++;
    await sleep(RATE_DELAY);
  }

  console.log(`\nDone. Success: ${done}, Errors: ${errors}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
