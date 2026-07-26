// elysium-ui/src/core/metadata/metadataRegistry.js
// Plugin registry for metadata providers — community can register new sources

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Metadata', msg);
}

class MetadataRegistry {
    constructor() {
        this.providers = new Map();
    }

    register(provider) {
        if (!provider.id || !provider.name || typeof provider.resolve !== 'function') {
            log('ERROR', 'Rejected invalid metadata provider');
            return;
        }
        this.providers.set(provider.id, provider);
        log('INFO', `Registered metadata provider: "${provider.name}"`);
    }

    unregister(id) {
        this.providers.delete(id);
    }

    getProvider(id) {
        return this.providers.get(id) || null;
    }

    getProviders() {
        return Array.from(this.providers.values());
    }

    async resolve(query, preferredId) {
        for (const [id, provider] of this.providers) {
            if (preferredId && id !== preferredId) continue;
            try {
                const result = await provider.resolve(query);
                if (result && result.length > 0) return result;
            } catch (err) {
                log('ERROR', `Provider "${provider.name}" failed: ${err.message || err}`);
            }
        }
        return [];
    }
}

export const metadataRegistry = new MetadataRegistry();
