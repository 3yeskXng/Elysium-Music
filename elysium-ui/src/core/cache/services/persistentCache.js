// elysium-ui/src/core/cache/services/persistentCache.js
// Persistent disk cache — stores playlist audio files with 1.5GB eviction limit

import { invokeBackend } from '../../../api.js';

const MAX_CACHE_BYTES = 1.5 * 1024 * 1024 * 1024;

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Cache', msg);
}

export async function cacheStore(trackId, sourcePath) {
    try {
        const result = await invokeBackend('cache_store_file', { trackId, sourcePath });
        await enforceLimit();
        return result;
    } catch (err) {
        log('ERROR', `cacheStore failed: ${err.message || err}`);
        return null;
    }
}

export async function cacheGetPath(trackId) {
    try {
        return await invokeBackend('cache_get_file', { trackId });
    } catch (err) {
        return null;
    }
}

export async function cacheGetSize() {
    try {
        return await invokeBackend('cache_get_size');
    } catch (_) {
        return 0;
    }
}

async function enforceLimit() {
    try {
        const size = await cacheGetSize();
        if (size > MAX_CACHE_BYTES) {
            await invokeBackend('cache_evict', { targetBytes: Math.floor(MAX_CACHE_BYTES * 0.8) });
            log('INFO', `Cache eviction triggered — reduced to ~80% of limit`);
        }
    } catch (err) {
        log('ERROR', `Cache enforcement failed: ${err.message || err}`);
    }
}
