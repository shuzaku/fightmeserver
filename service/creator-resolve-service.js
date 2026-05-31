var axios = require('axios');
var Creator = require('../models/creators');

/**
 * Normalize a creator profile URL for consistent lookups.
 * Strips www, trailing slashes, and maps x.com → twitter.com.
 */
function normalizeCreatorUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const u = new URL(raw.trim());
    let host = u.hostname.replace(/^www\./i, '').toLowerCase();
    if (host === 'x.com' || host === 'mobile.twitter.com') {
      host = 'twitter.com';
    }
    const pathname = u.pathname.replace(/\/+$/, '') || '';
    return `https://${host}${pathname}`;
  } catch (e) {
    return raw.trim();
  }
}

/**
 * Build a full watch URL from stored clip fields. Combos often store only
 * the YouTube video id or Twitter status id — ImportVideoUrl is preferred
 * when the client still has the pasted link.
 */
function buildVideoWatchUrl(videoType, urlOrId, importVideoUrl) {
  if (importVideoUrl && /^https?:\/\//i.test(String(importVideoUrl))) {
    return String(importVideoUrl).trim();
  }
  if (!urlOrId) return null;
  const v = String(urlOrId).trim();
  const type = (videoType || '').toLowerCase();
  if (/^https?:\/\//i.test(v)) return v;
  if (type === 'twitter' || type === 'x') {
    return `https://twitter.com/i/status/${v}`;
  }
  if (type === 'youtube') {
    return `https://www.youtube.com/watch?v=${v}`;
  }
  return v;
}

async function resolveYoutubeCreator(watchUrl) {
  const oembedUrl =
    'https://www.youtube.com/oembed?url=' +
    encodeURIComponent(watchUrl) +
    '&format=json';
  const { data } = await axios.get(oembedUrl, { timeout: 8000 });
  if (!data || !data.author_url) return null;
  return {
    name: (data.author_name || 'YouTube Channel').trim(),
    url: normalizeCreatorUrl(data.author_url),
  };
}

async function resolveTwitterCreator(tweetIdOrUrl) {
  let tweetId = tweetIdOrUrl;
  const raw = String(tweetIdOrUrl || '');
  if (/twitter|x\.com/i.test(raw)) {
    const m = raw.match(/status\/(\d+)/);
    if (m) tweetId = m[1];
  }
  const metaResponse = await axios.get(
    `https://api.fxtwitter.com/status/${tweetId}`,
    { headers: { 'User-Agent': 'FightersEdge/1.0' }, timeout: 8000 }
  );
  const author =
    metaResponse.data &&
    metaResponse.data.tweet &&
    metaResponse.data.tweet.author;
  if (!author || !author.screen_name) return null;
  const handle = author.screen_name;
  return {
    name: (author.name || handle).trim(),
    url: normalizeCreatorUrl(`https://twitter.com/${handle}`),
  };
}

/**
 * Resolve channel/profile name + URL from a combo or match video link.
 */
async function resolveCreatorFromVideo({ videoType, url, importVideoUrl }) {
  const watchUrl = buildVideoWatchUrl(videoType, url, importVideoUrl);
  if (!watchUrl) return null;

  const type = (videoType || '').toLowerCase();
  try {
    if (type === 'twitter' || type === 'x' || /twitter|x\.com/i.test(watchUrl)) {
      return await resolveTwitterCreator(watchUrl);
    }
    if (
      type === 'youtube' ||
      /youtube\.com|youtu\.be/i.test(watchUrl)
    ) {
      return await resolveYoutubeCreator(watchUrl);
    }
  } catch (err) {
    console.error('[creator-resolve]', err.message);
    return null;
  }
  return null;
}

function findCreatorByUrl(normalizedUrl) {
  return Creator.findOne({
    $or: [{ Url: normalizedUrl }, { YoutubeUrl: normalizedUrl }],
  }).exec();
}

function createCreator({ name, url }) {
  const doc = new Creator({
    Name: name,
    Url: url,
    YoutubeUrl: /youtube/i.test(url) ? url : undefined,
  });
  return doc.save();
}

/**
 * Look up a creator by profile URL; create one if missing.
 * Returns the Mongoose document or null when the video URL cannot be resolved.
 */
async function findOrCreateFromVideo(params) {
  const resolved = await resolveCreatorFromVideo(params);
  if (!resolved || !resolved.url) return null;

  const normalized = normalizeCreatorUrl(resolved.url);
  const existing = await findCreatorByUrl(normalized);
  if (existing) return existing;

  return createCreator({ name: resolved.name, url: normalized });
}

module.exports = {
  normalizeCreatorUrl,
  buildVideoWatchUrl,
  resolveCreatorFromVideo,
  findOrCreateFromVideo,
};
