/**
 * Generic Fandom/Miraheze move-list parser.
 *
 * Expected wiki structure (Fandom-style):
 *   - Each move is a table row in a table with class containing "wikitable"
 *     or similar, OR an individual section/div with a move image + name.
 *
 * Exported: async function parse($, wikiUrl)
 *   Returns: Array<{ moveName, imageUrl, wikiSourceUrl }>
 *
 * $ — Cheerio root loaded with the wiki page HTML.
 * wikiUrl — the original URL (used to resolve relative src paths).
 */

'use strict';

const { URL } = require('url');

function resolveUrl(src, base) {
  if (!src) return '';
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

function cleanMoveName(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Strategy 1 — table rows: each <tr> contains <td> cells where one cell has
 * a move name and another has an <img>.
 */
function parseFromTable($, baseUrl) {
  const results = [];
  $('table.wikitable tbody tr, table[class*="movelist"] tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;
    const img = $(row).find('img').first();
    const imgSrc = img.attr('data-src') || img.attr('src') || '';
    // Heuristic: longest text cell is the move name
    let moveName = '';
    cells.each((_, cell) => {
      const text = $(cell).text().trim();
      if (text.length > moveName.length) moveName = text;
    });
    moveName = cleanMoveName(moveName);
    if (!moveName) return;
    results.push({
      moveName,
      imageUrl: imgSrc ? resolveUrl(imgSrc, baseUrl) : '',
      wikiSourceUrl: baseUrl,
    });
  });
  return results;
}

/**
 * Strategy 2 — gallery/card style: each move is a <div class="..."> containing
 * an <img> and a <figcaption> or text label (common on newer Fandom pages).
 */
function parseFromGallery($, baseUrl) {
  const results = [];
  const selectors = [
    '.wikia-gallery-item',
    '.gallery-box',
    '.movebox',
    '[class*="move-card"]',
    '[class*="move_card"]',
    'figure.thumb',
  ];
  $(selectors.join(', ')).each((_, el) => {
    const img = $(el).find('img').first();
    const imgSrc = img.attr('data-src') || img.attr('src') || '';
    const caption = $(el).find('figcaption, .lightbox-caption, .gallerytext').first().text();
    const moveName = cleanMoveName(caption);
    if (!moveName) return;
    results.push({
      moveName,
      imageUrl: imgSrc ? resolveUrl(imgSrc, baseUrl) : '',
      wikiSourceUrl: baseUrl,
    });
  });
  return results;
}

/**
 * Strategy 3 — headings + first image: works on wiki pages where each move
 * is an <h3>/<h4> followed by an <img> in the next few siblings.
 */
function parseFromHeadings($, baseUrl) {
  const results = [];
  $('h3, h4').each((_, heading) => {
    const moveName = cleanMoveName($(heading).text().replace(/\[.*?\]/g, ''));
    if (!moveName || moveName.length > 80) return;
    // Look for an image in the next 5 sibling elements
    let sibling = $(heading).next();
    let imgSrc = '';
    for (let i = 0; i < 5; i++) {
      const img = sibling.find('img').first();
      if (img.length) {
        imgSrc = img.attr('data-src') || img.attr('src') || '';
        break;
      }
      sibling = sibling.next();
    }
    results.push({
      moveName,
      imageUrl: imgSrc ? resolveUrl(imgSrc, baseUrl) : '',
      wikiSourceUrl: baseUrl,
    });
  });
  return results;
}

/**
 * parse — tries each strategy in order and returns the best result
 * (most moves with images wins).
 */
async function parse($, wikiUrl) {
  const strategies = [
    parseFromTable,
    parseFromGallery,
    parseFromHeadings,
  ];

  let best = [];
  for (const strategy of strategies) {
    const result = strategy($, wikiUrl);
    if (result.length > best.length) {
      best = result;
    }
    if (best.length >= 5) break; // good enough — stop early
  }

  // Deduplicate by moveName
  const seen = new Set();
  return best.filter((m) => {
    const key = m.moveName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { parse };
