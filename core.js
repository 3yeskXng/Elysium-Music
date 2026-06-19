// core.js
const fs = require('fs');
const path = require('path');

class ElysiumCore {
    constructor() {
        this.config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        this.plugins = {};
        this.cacheFile = './.cache/stream_cache.json';
        this.cache = {};

        // Secure environment directories
        if (!fs.existsSync(this.config.downloadDir)) fs.mkdirSync(this.config.downloadDir, { recursive: true });
        if (!fs.existsSync('./.cache')) fs.mkdirSync('./.cache', { recursive: true });

        // Initialize Levers 1 & 2
        this._autoloadPlugins();
        this._loadCache();
    }

    /**
     * Lever 1: Autoloading - Automatically registers any file inside the modules folder
     */
    _autoloadPlugins() {
        const modulesDir = path.join(__dirname, 'modules');
        if (!fs.existsSync(modulesDir)) return;

        const files = fs.readdirSync(modulesDir);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const pluginName = path.basename(file, '.js');
                
                // Lever 2: Lazy Loading - Save the path reference, do NOT require/load the code yet
                this.plugins[pluginName] = {
                    filePath: path.join(modulesDir, file),
                    instance: null
                };
            }
        });
        console.log(`[Elysium Core] System initialized. Autoloaded ${Object.keys(this.plugins).length} plugins.`);
    }

    _loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try { this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8')); } 
            catch (e) { this.cache = {}; }
        }
    }

    _saveCache() {
        fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
    }

    /**
     * Lever 2: Lazy Loader Execution - Loads plugin code into memory only upon absolute necessity
     */
    _getPlugin(name) {
        const plugin = this.plugins[name];
        if (!plugin) throw new Error(`Plugin "${name}" does not exist inside the environment.`);
        
        if (!plugin.instance) {
            plugin.instance = require(plugin.filePath); // Execution occurs here on demand
        }
        return plugin.instance;
    }

    /**
     * Lever 4: Asynchronicity - Powered by Promises/Async/Await to keep the runtime entirely non-blocking
     */
    async play(trackQuery) {
        const engineName = this.config.defaultEngine;
        console.log(`\n[Elysium Core] Processing request for: "${trackQuery}"`);

        // Lever 3: Caching - Instant lookup boundary (0ms wait time for cached items)
        if (engineName === 'streamer' && this.cache[trackQuery]) {
            const cached = this.cache[trackQuery];
            if (Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
                console.log(`[Elysium Core] 🚀 CACHE HIT! Stream URL resolved instantly. Launching playback...`);
                return this._executePlayback(cached.url);
            }
        }

        try {
            const engine = this._getPlugin(engineName);
            
            if (engineName === 'streamer') {
                const streamUrl = await engine.getStreamUrl(trackQuery);
                
                // Commit to local cache storage
                this.cache[trackQuery] = { url: streamUrl, timestamp: Date.now() };
                this._saveCache();

                await this._executePlayback(streamUrl);
            } else if (engineName === 'downloader') {
                const localPath = await engine.downloadTrack(trackQuery, this.config.downloadDir);
                await this._executePlayback(localPath);
            }
        } catch (error) {
            console.error(`[Elysium Core] Execution failed: ${error.message}`);
        }
    }

    async _executePlayback(target) {
        const player = this._getPlugin('player');
        return new Promise((resolve, reject) => {
            player.play(target, (err) => {
                if (err) reject(err);
                else {
                    console.log("[Elysium Core] Playback process finished.\n");
                    resolve();
                }
            });
        });
    }
}

const coreInstance = new ElysiumCore();
module.exports = coreInstance;

// CLI Parameter Interface Input Boundary
if (require.main === module) {
    const userTrack = process.argv.slice(2).join(' ');
    if (userTrack) {
        coreInstance.play(userTrack);
    } else {
        console.log("[Elysium] Standby. Usage: node core.js <Song Name>");
    }
}