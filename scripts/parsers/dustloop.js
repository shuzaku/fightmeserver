/**
 * Dustloop wiki parser (dustloop.com)
 *
 * Structure: every move lives under a
 *   <div class="mw-heading mw-heading3">
 *     <h3 id="MoveName"><big><span class="colorful-text-N">MoveName</span></big></h3>
 *   </div>
 *   <div class="attack-container">
 *     <div class="attack-gallery">
 *       <div class="attack-gallery-image">
 *         <img src="…/thumb/…/186px-….png" srcset="…/371px-….png 2x" />
 *       </div>
 *     </div>
 *   </div>
 *
 * Images are the static thumb PNGs served by Dustloop's CDN.
 * We prefer the 2x srcset URL for a higher-resolution thumbnail.
 * ImageUrl is stored as an absolute Dustloop CDN URL.
 *
 * Attribution: WikiSourceUrl is set to the character's wiki page.
 * The frontend displays a credit link back to dustloop.com.
 *
 * Exported: async function parse($, wikiUrl)
 * Returns:  Array<{ moveName, imageUrl, wikiSourceUrl }>
 */

'use strict';

const SECTION_HEADINGS = new Set([
  'normal moves', 'special moves', 'overdrives', 'system mechanics',
  'unique attacks', 'command normals', 'universal mechanics',
  'charged attacks', 'super moves', 'super specials', 'supers',
  'specials', 'normals', 'throws', 'air normals', 'jump normals',
  'gatling options', 'navigation', 'overview', 'lore', 'gameplay',
  'combos', 'strategy', 'frame data', 'matchups', 'resources',
  'table of contents',
]);

function looksLikeMove(text) {
  if (!text || text.length > 50) return false;
  const lower = text.toLowerCase();
  if (SECTION_HEADINGS.has(lower)) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^(edit|contents|see also|references|external links)$/i.test(text)) return false;
  return true;
}

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

async function parse($, wikiUrl) {
  const results = [];
  const seen = new Set();

  // Each move is wrapped in a .mw-heading div followed by a .attack-container div.
  // We iterate heading divs, extract the move name from the colorful-text span (or
  // the mw-headline span as fallback), then walk to the next attack-container for
  // the image.
  $('.mw-heading h3, .mw-heading h4').each((_, el) => {
    const nameSpan = $(el).find('[class*="colorful-text"]').first();
    const bigTag = $(el).find('big').first();
    const fallback = $(el).find('.mw-headline').first();
    const raw = (nameSpan.length ? nameSpan : bigTag.length ? bigTag : fallback).text();
    const moveName = raw.replace(/\[.*?\]/g, '').trim();

    if (!looksLikeMove(moveName)) return;
    const key = moveName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    // The .attack-container may be separated from .mw-heading by an input-badge <p>
    // (special moves / overdrives), so search all siblings up to the next heading.
    const container = $(el).closest('.mw-heading')
      .nextUntil('.mw-heading')
      .filter('.attack-container')
      .first();
    const img = container.find('.attack-gallery-image img').first();

    let imageUrl = '';
    if (img.length) {
      const srcset = img.attr('srcset') || '';
      const src = img.attr('src') || '';
      // Prefer highest-res from srcset (2x), fall back to src
      const m2x = srcset.match(/(\S+)\s+2x/);
      const best = m2x ? m2x[1] : src;
      imageUrl = resolveUrl(best, wikiUrl);
    }

    results.push({ moveName, imageUrl, wikiSourceUrl: wikiUrl });
  });

  return results;
}

module.exports = { parse };
