// src/core/pluginManager.js

class ElysiumPluginManager {
    constructor() {
        this.plugins = new Map();
        this.plugins.set('youtube_core', { id: 'youtube_core', name: 'YouTube Audio Streamer', version: '2.1.0', active: true });
        this.plugins.set('spotify_bridge', { id: 'spotify_bridge', name: 'Spotify Web API Bridge', version: '1.0.4', active: false });
    }

    getPlugins() {
        return Array.from(this.plugins.values());
    }

    togglePlugin(id) {
        if (this.plugins.has(id)) {
            const plugin = this.plugins.get(id);
            plugin.active = !plugin.active;
            console.log(`[Plugin System] Toggle module "${id}" status to: ${plugin.active}`);
        }
    }

    // NEU: Damit andere Systemteile den Schalter abfragen können!
    isPluginActive(id) {
        return this.plugins.has(id) ? this.plugins.get(id).active : false;
    }
}

export const pluginManager = new ElysiumPluginManager();