// core.js
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events'); // Native Node.js Event Broker Architecture

class ElysiumCore extends EventEmitter {
    constructor() {
        super(); // Initialize core event emitting capabilities
        
        this.configFile = './config.json';
        this.cacheFile = './.cache/stream_cache.json';
        this.plugins = {};
        this.cache = {};

        // 1. SELF-HEALING: Auto-create missing config.json with precise defaults
        if (!fs.existsSync(this.configFile)) {
            console.log("[Elysium Init] ⚙️ Configuration file missing. Creating default config.json...");
            const defaultConfig = {
                defaultEngine: "auto",
                downloadDir: "./downloads",
                cacheExpiryMs: 3600000,
                language: "de"
            };
            fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2), 'utf8');
        }

        // Load config securely after ensuring it exists
        this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));

        // 2. SELF-HEALING: Mandate and auto-generate crucial system folders
        const requiredDirectories = [
            this.config.downloadDir,
            './playlists',
            './.cache'
        ];

        requiredDirectories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                console.log(`[Elysium Init] 📁 Creating missing system directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Internal state machines for async queue control
        this.isProcessingQueue = false;
        this.forceSkip = false;

        // Bootstrapping the subsystem bridges
        this._autoloadPlugins();
        this._loadCache();
    }

    /**
     * Map out the plugins directory dynamically. 
     * Keeps core decoupled from hard dependencies.
     */
    _autoloadPlugins() {
        const modulesDir = path.join(__dirname, 'modules');
        if (!fs.existsSync(modulesDir)) return;

        const files = fs.readdirSync(modulesDir);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const pluginName = path.basename(file, '.js');
                this.plugins[pluginName] = { filePath: path.join(modulesDir, file), instance: null };
            }
        });
    }

    _loadCache() {
        if (fs.existsSync(this.cacheFile)) {
            try { this.cache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8')); } catch (e) { this.cache = {}; }
        }
    }

    _saveCache() {
        fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2), 'utf8');
    }

    /**
     * Lazy-loads modules into memory on-demand. Resolves memory footprints instantly.
     */
    _getPlugin(name) {
        const plugin = this.plugins[name];
        if (!plugin) throw new Error(`Plugin "${name}" missing from infrastructure registry.`);
        if (!plugin.instance) plugin.instance = require(plugin.filePath);
        return plugin.instance;
    }

    /**
     * Controller Interface Command: Enqueue a track query and kickstart processing loop
     * @param {string} trackQuery 
     */
    enqueue(trackQuery) {
        const queue = this._getPlugin('queue');
        queue.enqueue(trackQuery);
        this.emit('queueChanged', queue.getTracks());
        this._processQueueLoop();
    }

    /**
     * Controller Interface Command: Interrupt active audio stream instantly
     */
    skip() {
        this.forceSkip = true;
        try { this._getPlugin('player').stop(); } catch (e) {}
    }

    /**
     * Controller Interface Command: Purge states and halt playback processes instantly
     */
    stopAll() {
        try {
            this._getPlugin('queue').clear();
            this._getPlugin('player').stop();
            this.emit('queueChanged', []);
        } catch (e) {}
    }

    /**
     * UI-Ready Command: Load a local playlist and feed all tracks into the processing queue
     * @param {string} playlistName 
     */
    loadPlaylist(playlistName) {
        const i18n = this._getPlugin('i18n');
        const playlistModule = this._getPlugin('playlist');
        
        this.emit('statusMessage', i18n.t('playlist_loading') + `"${playlistName}"`);
        
        const tracks = playlistModule.readPlaylist(playlistName);
        
        if (tracks === null) {
            this.emit('error', i18n.t('playlist_err_not_found'));
            return;
        }
        
        if (tracks.length === 0) {
            this.emit('error', i18n.t('playlist_err_empty'));
            return;
        }

        // Push each track into the existing queue infrastructure
        tracks.forEach(track => {
            const queue = this._getPlugin('queue');
            queue.enqueue(track);
        });

        // Broadcast the structural change to listeners (CLI/UI)
        this.emit('queueChanged', this._getPlugin('queue').getTracks());
        
        const successMessage = i18n.t('playlist_loaded')
            .replace('X', tracks.length) + `"${playlistName}"`;
            
        this.emit('statusMessage', successMessage);

        // Trigger the loop chain engine
        this._processQueueLoop();
    }

    /**
     * Detached Core Queue Processing Engine (Runs independent from CLI / UI bindings)
     */
    async _processQueueLoop() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        const queue = this._getPlugin('queue');
        let nextTrack = queue.dequeue();

        while (nextTrack !== null) {
            this.forceSkip = false;
            this.emit('queueChanged', queue.getTracks());
            
            await this._playTrack(nextTrack);
            
            if (this.forceSkip) {
                this.emit('trackSkipped');
            }
            
            nextTrack = queue.dequeue();
        }

        this.isProcessingQueue = false;
        this.emit('queueConcluded');
    }

    /**
     * Strategic Playback Resolution Layer (Handles Caching, Local Storage, and Hybrid Engine switching)
     */
    async _playTrack(trackQuery) {
        const engineName = this.config.defaultEngine;
        const i18n = this._getPlugin('i18n');

        // 1. Boundary Layer: Memory Stream Cache Check (Fast Return)
        if (engineName === 'streamer' && this.cache[trackQuery]) {
            const cached = this.cache[trackQuery];
            if (Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
                this.emit('trackStarted', trackQuery);
                return this._executePlayback(cached.url);
            }
        }

        // 2. Boundary Layer: Local Storage Opus Library Check (0ms Native Local Playback)
        try {
            this.emit('statusMessage', i18n.t('library_searching'));
            const library = this._getPlugin('library');
            const localMatch = library.findLocalTrack(trackQuery, this.config.downloadDir);

            if (localMatch) {
                this.emit('statusMessage', i18n.t('library_hit'));
                this.emit('trackStarted', trackQuery);
                return this._executePlayback(localMatch);
            }
        } catch (libraryError) {
            // Silently fall back to network infrastructure if storage scanning faults
        }

        // 3. Boundary Layer: Network Infrastructure Request (yt-dlp core abstraction)
        try {
            // HYBRID AUTO MODE LOGIC
            if (engineName === 'auto') {
                this.emit('statusMessage', i18n.t('auto_mode_active'));
                
                const streamer = this._getPlugin('streamer');
                const streamUrl = await streamer.getStreamUrl(trackQuery);
                
                this.cache[trackQuery] = { url: streamUrl, timestamp: Date.now() };
                this._saveCache();
                this.emit('trackStarted', trackQuery);

                // BACKGROUND ASYNC DOWNLOAD (Lever 4 Parallelization: No await, entirely non-blocking!)
                const downloader = this._getPlugin('downloader');
                downloader.downloadTrack(trackQuery, this.config.downloadDir)
                    .then(() => {
                        this.emit('statusMessage', i18n.t('auto_mode_complete') + `"${trackQuery}"`);
                    })
                    .catch(() => {
                        // Silent catch to prevent background IO glitches from freezing live playback
                    });

                // Stream audio stream right now while downloader syncs file structure in the background
                await this._executePlayback(streamUrl);

            } else {
                // TRADITIONAL SINGLE-ENGINE CONFIGURATION
                const engine = this._getPlugin(engineName);
                this.emit('statusMessage', i18n.t('engine_active') + `[${engineName}] -> "${trackQuery}"`);

                if (engineName === 'streamer') {
                    const streamUrl = await engine.getStreamUrl(trackQuery);
                    this.cache[trackQuery] = { url: streamUrl, timestamp: Date.now() };
                    this._saveCache();
                    this.emit('trackStarted', trackQuery);
                    await this._executePlayback(streamUrl);
                } else if (engineName === 'downloader') {
                    const localPath = await engine.downloadTrack(trackQuery, this.config.downloadDir);
                    this.emit('trackStarted', trackQuery);
                    await this._executePlayback(localPath);
                }
            }
        } catch (error) {
            this.emit('error', error.message);
        }
    }

    /**
     * Low-level driver linkage execution boundary with reactive stream monitoring
     */
    async _executePlayback(target) {
        const player = this._getPlugin('player');
        return new Promise((resolve) => {
            player.play(target, () => {
                resolve(); // Unlock playback loop promise chain on process exit
            }, (current, total) => {
                // Calculate state configurations
                const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
                
                // Pure helper for track duration string mapping
                const formatTime = (secs) => {
                    if (!secs || isNaN(secs) || secs < 0) return "00:00";
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                };

                // Broadcast live playback payload (Ready for Terminal CLI or Frontend GUI Sliders)
                this.emit('playbackProgress', {
                    current: current,
                    total: total,
                    currentFormatted: formatTime(current),
                    totalFormatted: formatTime(total),
                    percentage: Math.min(percentage, 100)
                });
            });
        });
    }
}

module.exports = new ElysiumCore();