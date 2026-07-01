/**
 * 2XKO wiki parser (wiki.play2xko.com)
 *
 * Each move is a .move-template block:
 *   - Primary name in h4 (5L, Steel Tempest, …)
 *   - Follow-up names in h5 when no h4 (Stomp, Lashing Wind, …)
 *   - Action image in .move-image img (not input glyph SVGs)
 */

'use strict';

function resolveUrl(src, baseUrl) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  try {
    const base = new (require('url').URL)(baseUrl);
    return `${base.protocol}//${base.host}${src.startsWith('/') ? '' : '/'}${src}`;
  } catch {
    return src;
  }
}

function moveNameFromTemplate($, el) {
  const $el = $(el);
  const h4 = $el.find('h4').first().text().replace(/\[.*?\]/g, '').trim();
  if (h4) return h4;
  return $el.find('h5').first().text().replace(/\[.*?\]/g, '').trim();
}

function isActionImage(src) {
  if (!src) return false;
  if (src.includes('Glyph-')) return false;
  if (src.includes('mw-broken-media')) return false;
  return true;
}

async function parse($, wikiUrl) {
  const results = [];
  const seen = new Set();

  $('.move-template').each((_, el) => {
    const moveName = moveNameFromTemplate($, el);
    if (!moveName || moveName.length > 80) return;

    const key = moveName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const img = $(el).find('.move-image img').first();
    const rawSrc = img.attr('src') || '';
    const imageUrl = isActionImage(rawSrc) ? resolveUrl(rawSrc, wikiUrl) : '';

    results.push({ moveName, imageUrl, wikiSourceUrl: wikiUrl });
  });

  return results;
}

module.exports = { parse };
