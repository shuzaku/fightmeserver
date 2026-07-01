/**
 * SuperCombo wiki parser (wiki.supercombo.gg)
 *
 * SF6 move structure per move:
 *   <div class="mw-heading mw-heading5"><h5 id="5LP"><font ...>5LP</font></h5></div>
 *   <div class="movedata-container">
 *     <div class="movedata-flex-image-container">
 *       <div>
 *         <div><big>Standing Light Punch</big></div>   ← full name
 *         ...
 *       </div>
 *       <div class="movedata-flex-images">
 *         <div class="move-image">                     ← action image (not hitbox)
 *           <div class="movedatacargoimage">
 *             <span ...><a ...><img src="..." srcset="... 2x"/></a></span>
 *           </div>
 *         </div>
 *         <div class="hitbox-image">...</div>
 *       </div>
 *     </div>
 *   </div>
 *
 * We use the full readable name from <big> and prefer the 2x srcset image.
 * Attribution: WikiSourceUrl is set to the character's wiki page.
 */

'use strict';

const SKIP_NAMES = new Set([
  'normals', 'standing normals', 'crouching normals', 'jumping normals',
  'air normals', 'unique attacks', 'command normals', 'special moves',
  'super arts', 'super art', 'critical arts', 'throws', 'throws / command grabs',
  'universal mechanics', 'system mechanics', 'v-skills', 'v-reversals',
  'v-triggers', 'drive moves', 'drive rush', 'drive parry', 'drive impact',
  'overdrive arts', 'supers', 'level 1', 'level 2', 'level 3',
  'introduction', 'overview', 'lore', 'strategy', 'frame data',
  'combos', 'navigation', 'table of contents', 'resources',
  'classic & modern versions comparison',
]);

function looksLikeMove(text) {
  if (!text || text.length > 60) return false;
  if (SKIP_NAMES.has(text.toLowerCase())) return false;
  if (/^\d+$/.test(text)) return false;
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
  // Prefer 2x, then 1.5x, then fall back to src
  const m2x = srcset.match(/(\S+)\s+2x/);
  if (m2x) return m2x[1];
  const m15 = srcset.match(/(\S+)\s+1\.5x/);
  if (m15) return m15[1];
  return src;
}

async function parse($, wikiUrl) {
  const results = [];
  const seen = new Set();

  // Each move is wrapped in a .movedata-container div.
  // The readable name lives in the first <big> tag inside .movedata-flex-image-container.
  // The action image is the first .move-image img (before the hitbox-image sibling).
  $('.movedata-container').each((_, container) => {
    const $c = $(container);

    // Full name from <big> inside the image-container header section
    const bigTag = $c.find('.movedata-flex-image-container big').first();
    const moveName = bigTag.text().replace(/\[.*?\]/g, '').trim();

    if (!looksLikeMove(moveName)) return;
    const key = moveName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    // Action image — first .move-image (not .hitbox-image)
    const img = $c.find('.move-image img').first();
    let imageUrl = '';
    if (img.length) {
      const raw = bestSrcset(img.attr('srcset') || '', img.attr('src') || '');
      imageUrl = resolveUrl(raw, wikiUrl);
    }

    results.push({ moveName, imageUrl, wikiSourceUrl: wikiUrl });
  });

  return results;
}

module.exports = { parse };
