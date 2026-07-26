// elysium-ui/src/core/cache/audioCache.js
// Unified audio cache facade — session (in-memory) + persistent (disk) layers

import { sessionCache } from './services/sessionCache.js';
import { cacheStore, cacheGetPath, cacheGetSize } from './services/persistentCache.js';
import { invokeBackend } from '../../api.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'AudioCache', msg);
}

export async function getCachedAudio(track) {
    const sessionHit = sessionCache.get(track.id);
    if (sessionHit) {
        log('INFO', `Session cache HIT: "${track.title}"`);
        return sessionHit.blobUrl;
    }

    const diskPath = await cacheGetPath(track.id);
    if (diskPath) {
        log('INFO', `Disk cache HIT: "${track.title}"`);
        return diskPath;
    }

    return null;
}

export async function storeToCache(track, sourcePath) {
    try {
        const bytes = await invokeBackend('get_track_bytes', { filePath: sourcePath });
        const ext = sourcePath.split('.').pop()?.toLowerCase() || 'opus';
        const mimeMap = { opus: 'audio/opus', mp3: 'audio/mpeg', webm: 'audio/webm' };
        const blob = new Blob([new Uint8Array(bytes)], { type: mimeMap[ext] || 'audio/opus' });
        const blobUrl = URL.createObjectURL(blob);
        sessionCache.store(track.id, blobUrl, bytes.length);
        log('INFO', `Session cache STORED: "${track.title}" (${(bytes.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
        log('ERROR', `Session store failed: ${err.message || err}`);
    }
}

export async function cacheForPlaylist(trackId, sourcePath) {
    await cacheStore(trackId, sourcePath);
}

export function getSessionCacheSize() {
    return sessionCache.getSizeBytes();
}

export function getSessionCacheCount() {
    return sessionCache.getCount();
}

export async function getPersistentCacheSize() {
    return await cacheGetSize();
}
