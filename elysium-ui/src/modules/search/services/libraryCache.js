// elysium-ui/src/modules/search/services/libraryCache.js
// Local library scan cache — scans once, reuses cached results within session

import { invokeBackend } from '../../../api.js';

let cachedTracks = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

export async function getLocalTracks() {
    if (cachedTracks && (Date.now() - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedTracks;
    }
    try {
        cachedTracks = await invokeBackend('scan_local_library');
        cacheTimestamp = Date.now();
        return cachedTracks;
    } catch (err) {
        cachedTracks = null;
        return [];
    }
}

export function invalidateCache() {
    cachedTracks = null;
    cacheTimestamp = 0;
}

window.addEventListener('elysium-library-refresh', invalidateCache);
