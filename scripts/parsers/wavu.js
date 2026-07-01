/**
 * Wavu wiki parser (wavu.wiki) — Tekken 8
 *
 * Character overview pages link to a separate movelist:
 *   https://wavu.wiki/t/Kazuya  →  https://wavu.wiki/t/Kazuya_movelist
 *
 * Each move is a .movedata block with name, input notation, and often an mp4 demo.
 */

'use strict';

function movelistUrl(wikiUrl) {
  try {
    const url = new URL(wikiUrl);
    const slug = url.pathname.replace(/^\/t\//, '').replace(/\/$/, '');
    if (!slug || slug.endsWith('_movelist') || slug.endsWith('_movetable')) {
      return wikiUrl;
    }
    return `${url.origin}/t/${slug}_movelist`;
  } catch {
    return wikiUrl;
  }
}

function resolveUrl(src, baseUrl) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  try {
    const base = new URL(baseUrl);
    return `${base.origin}${src.startsWith('/') ? '' : '/'}${src}`;
  } catch {
    return src;
  }
}

function looksLikeMove(name, input) {
  if (!name && !input) return false;
  if (name && name.length > 80) return false;
  if (/the name of the move|written in notation|most often directly/i.test(name)) return false;
  if (/^input$/i.test(name)) return false;
  return true;
}

function cleanMoveName(name, input, anchor) {
  if (name) return name.replace(/\s+/g, ' ').trim();
  if (input) return input.replace(/\s+/g, ' ').trim();
  if (anchor) return anchor.replace(/^[^-]+-/, '').replace(/_/g, ' ').trim();
  return '';
}

async function parse($, wikiUrl) {
  const listUrl = movelistUrl(wikiUrl);
  if (listUrl !== wikiUrl) {
    const axios = require('axios');
    const html = (await axios.get(listUrl, {
      headers: { 'User-Agent': 'FightersEdge-MoveScraper/1.0 (+https://fighters-edge.com)' },
      timeout: 15000,
    })).data;
    $ = require('cheerio').load(html);
    wikiUrl = listUrl;
  }

  const results = [];
  const seen = new Set();

  $('.movedata').each((_, el) => {
    const $el = $(el);
    const name = $el.find('.movedata-name').first().text().replace(/\s+/g, ' ').trim();
    const input = $el.find('.movedata-input').first().text().replace(/\s+/g, ' ').trim();
    const anchor = ($el.find('.movedata-id a').first().text() || '').replace(/^#/, '').trim();

    if (!looksLikeMove(name, input)) return;

    const moveName = cleanMoveName(name, input, anchor);
    if (!moveName) return;

    const key = (anchor || `${moveName}|${input}`).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const videoSrc = $el.find('video').first().attr('src') || '';
    const imageUrl = videoSrc ? resolveUrl(videoSrc, wikiUrl) : '';

    results.push({ moveName, imageUrl, wikiSourceUrl: wikiUrl });
  });

  return results;
}

module.exports = { parse, movelistUrl };
