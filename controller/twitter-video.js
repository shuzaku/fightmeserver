const axios = require('axios');

// Simple in-process cache: tweetId → { videoUrl, posterUrl, ... }
const videoUrlCache = {};

async function resolveVideoUrl(tweetId) {
    if (videoUrlCache[tweetId]) return videoUrlCache[tweetId];

    const metaResponse = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
        headers: { 'User-Agent': 'FightersEdge/1.0' },
        timeout: 8000,
    });

    const tweet = metaResponse.data && metaResponse.data.tweet;
    const videos = tweet && tweet.media && tweet.media.videos;

    if (!videos || videos.length === 0) return null;

    const best = videos[0];
    const entry = {
        videoUrl: best.url,
        posterUrl: best.thumbnail_url || null,
        width: best.width || null,
        height: best.height || null,
        text: tweet.text || null,
        author: tweet.author ? (tweet.author.name || tweet.author.screen_name || null) : null,
        authorHandle: tweet.author ? tweet.author.screen_name || null : null,
    };
    videoUrlCache[tweetId] = entry;
    return entry;
}

async function getTwitterVideo(req, res) {
    const { tweetId } = req.query;
    if (!tweetId) return res.status(400).json({ error: 'tweetId is required' });

    try {
        const entry = await resolveVideoUrl(tweetId);
        if (!entry) return res.status(404).json({ error: 'No video found in tweet' });
        return res.json(entry);
    } catch (err) {
        console.error('twitter-video error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch Twitter video' });
    }
}

async function streamTwitterVideo(req, res) {
    const { tweetId } = req.query;
    if (!tweetId) return res.status(400).json({ error: 'tweetId is required' });

    try {
        const entry = await resolveVideoUrl(tweetId);
        if (!entry) return res.status(404).json({ error: 'No video found in tweet' });

        const requestHeaders = {
            'Referer': 'https://twitter.com/',
            'Origin': 'https://twitter.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (req.headers.range) {
            requestHeaders['Range'] = req.headers.range;
        }

        const videoResponse = await axios.get(entry.videoUrl, {
            responseType: 'stream',
            headers: requestHeaders,
            timeout: 30000,
        });

        res.status(videoResponse.status);
        res.setHeader('Content-Type', videoResponse.headers['content-type'] || 'video/mp4');
        if (videoResponse.headers['content-length']) {
            res.setHeader('Content-Length', videoResponse.headers['content-length']);
        }
        if (videoResponse.headers['content-range']) {
            res.setHeader('Content-Range', videoResponse.headers['content-range']);
        }
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        videoResponse.data.pipe(res);
    } catch (err) {
        console.error('twitter-video-stream error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to stream Twitter video' });
    }
}

module.exports = { getTwitterVideo, streamTwitterVideo };
