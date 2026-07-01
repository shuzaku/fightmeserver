/**
 * Dreamcancel wiki parser (dreamcancel.com)
 *
 * COTW / Garou move pages use MediaWiki headings:
 *   <div class="mw-heading mw-heading4"><h4>Far A</h4></div>
 *   <table class="wikitable">…<img src="/w/images/thumb/…/COTW_….png" />…</table>
 *
 * Section labels (Far Standing Normals, etc.) are h3 and skipped.
 */

'use strict';

const SECTION_HEADINGS = new Set([
  'normal moves', 'special moves', 'overdrives', 'system mechanics',
  'unique attacks', 'command normals', 'universal mechanics',
  'charged attacks', 'super moves', 'super specials', 'supers',
  'specials', 'normals', 'throws', 'air normals', 'jump normals',
  'far standing normals', 'close standing normals', 'crouch normals',
  'jump normals', 'dodge attacks', 'power charge', 'command combos',
  'navigation', 'overview', 'lore', 'gameplay', 'combos', 'strategy',
  'frame data', 'matchups', 'resources', 'table of contents',
]);

function looksLikeMove(text) {
  if (!text || text.length > 60) return false;
  if (SECTION_HEADINGS.has(text.toLowerCase())) return false;
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

function bestSrcset(srcset, src) {
  if (!srcset) return src;
  const m2x = srcset.match(/(\S+)\s+2x/);
  if (m2x) return m2x[1];
  const m15 = srcset.match(/(\S+)\s+1\.5x/);
  if (m15) return m15[1];
  return src;
}

async function parse($, wikiUrl) {
  const results = [];
  const seen = new Set();

  $('.mw-heading h4').each((_, el) => {
    const nameSpan = $(el).find('[class*="colorful-text"]').first();
    const raw = (nameSpan.length ? nameSpan : $(el)).text();
    const moveName = raw.replace(/\[.*?\]/g, '').trim();

    if (!looksLikeMove(moveName)) return;
    const key = moveName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const section = $(el).closest('.mw-heading').nextUntil('.mw-heading');
    const img = section.find('table.wikitable img').first();

    let imageUrl = '';
    if (img.length) {
      const rawSrc = bestSrcset(img.attr('srcset') || '', img.attr('src') || '');
      imageUrl = resolveUrl(rawSrc, wikiUrl);
    }

    results.push({ moveName, imageUrl, wikiSourceUrl: wikiUrl });
  });

  return results;
}

module.exports = { parse };
