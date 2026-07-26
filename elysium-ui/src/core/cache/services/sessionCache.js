// elysium-ui/src/core/cache/services/sessionCache.js
// In-memory session cache — stores downloaded audio blobs for instant replay during app session

class SessionCache {
    constructor() {
        this._entries = new Map();
    }

    get(trackId) {
        return this._entries.get(trackId) || null;
    }

    has(trackId) {
        return this._entries.has(trackId);
    }

    store(trackId, blobUrl, sizeBytes) {
        if (this._entries.has(trackId)) return;
        this._entries.set(trackId, { blobUrl, sizeBytes, timestamp: Date.now() });
    }

    remove(trackId) {
        const entry = this._entries.get(trackId);
        if (entry) {
            try { URL.revokeObjectURL(entry.blobUrl); } catch (_) {}
            this._entries.delete(trackId);
        }
    }

    getSizeBytes() {
        let total = 0;
        for (const entry of this._entries.values()) {
            total += entry.sizeBytes || 0;
        }
        return total;
    }

    getCount() {
        return this._entries.size;
    }

    clear() {
        for (const entry of this._entries.values()) {
            try { URL.revokeObjectURL(entry.blobUrl); } catch (_) {}
        }
        this._entries.clear();
    }
}

export const sessionCache = new SessionCache();
