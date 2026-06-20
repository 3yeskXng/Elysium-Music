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
        this.isPaused = false;

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

    // --- ULTRA-KOMPATIBILITÄTS-LAYER FÜR DEINE CLI ---
    get isPlaying() {
        try { return !!this._getPlugin('player').audioProcess; } catch(e) { return false; }
    }
    get playing() {
        return this.isPlaying;
    }
    get audioProcess() {
        try { return this._getPlugin('player').audioProcess; } catch(e) { return null; }
    }
    pause() {
        return this.togglePause(true);
    }
    resume() {
        return this.togglePause(false);
    }
    // -------------------------------------------------

    /**
     * Map out the plugins directory dynamically. 
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

    _getPlugin(name) {
        const plugin = this.plugins[name];
        if (!plugin) throw new Error(`Plugin "${name}" missing from infrastructure registry.`);
        if (!plugin.instance) plugin.instance = require(plugin.filePath);
        return plugin.instance;
    }

    /**
     * Zentralisierte Steuerung für Pause und Fortsetzen.
     */
    togglePause(shouldPause) {
        try {
            const player = this._getPlugin('player');
            
            if (shouldPause === undefined) {
                this.isPaused = !this.isPaused;
            } else {
                this.isPaused = shouldPause;
            }
            
            player.isPaused = this.isPaused;

            if (typeof player.togglePause === 'function') {
                player.togglePause(this.isPaused);
            } else if (this.isPaused && typeof player.pause === 'function') {
                player.pause();
            } else if (!this.isPaused && typeof player.resume === 'function') {
                player.resume();
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    enqueue(trackQuery) {
        const queue = this._getPlugin('queue');
        queue.enqueue(trackQuery);
        this.emit('queueChanged', queue.getTracks());
        this._processQueueLoop();
    }

    skip() {
        this.forceSkip = true;
        this.isPaused = false;
        try { this._getPlugin('player').stop(); } catch (e) {}
    }

    stopAll() {
        this.isPaused = false;
        try {
            this._getPlugin('queue').clear();
            this._getPlugin('player').stop();
            this.emit('queueChanged', []);
        } catch (e) {}
    }

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

        tracks.forEach(track => {
            const queue = this._getPlugin('queue');
            queue.enqueue(track);
        });

        this.emit('queueChanged', this._getPlugin('queue').getTracks());
        
        const successMessage = i18n.t('playlist_loaded')
            .replace('X', tracks.length) + `"${playlistName}"`;
            
        this.emit('statusMessage', successMessage);
        this._processQueueLoop();
    }

    async _processQueueLoop() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        const queue = this._getPlugin('queue');
        let nextTrack = queue.dequeue();

        while (nextTrack !== null) {
            this.forceSkip = false;
            this.isPaused = false;
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

    async _playTrack(trackQuery) {
        const engineName = this.config.defaultEngine;
        const i18n = this._getPlugin('i18n');

        if (engineName === 'streamer' && this.cache[trackQuery]) {
            const cached = this.cache[trackQuery];
            if (Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
                this.emit('trackStarted', trackQuery);
                return this._executePlayback(cached.url);
            }
        }

        try {
            this.emit('statusMessage', i18n.t('library_searching'));
            const library = this._getPlugin('library');
            const localMatch = library.findLocalTrack(trackQuery, this.config.downloadDir);

            if (localMatch) {
                this.emit('statusMessage', i18n.t('library_hit'));
                this.emit('trackStarted', trackQuery);
                return this._executePlayback(localMatch);
            }
        } catch (libraryError) {}

        try {
            if (engineName === 'auto') {
                this.emit('statusMessage', i18n.t('auto_mode_active'));
                
                const streamer = this._getPlugin('streamer');
                const streamUrl = await streamer.getStreamUrl(trackQuery);
                
                this.cache[trackQuery] = { url: streamUrl, timestamp: Date.now() };
                this._saveCache();
                this.emit('trackStarted', trackQuery);

                const downloader = this._getPlugin('downloader');
                downloader.downloadTrack(trackQuery, this.config.downloadDir)
                    .then(() => {
                        this.emit('statusMessage', i18n.t('auto_mode_complete') + `"${trackQuery}"`);
                    })
                    .catch(() => {});

                await this._executePlayback(streamUrl);

            } else {
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

    async _executePlayback(target) {
        const player = this._getPlugin('player');
        this.isPaused = false;
        player.isPaused = false;

        return new Promise((resolve) => {
            player.play(target, () => {
                resolve(); 
            }, (current, total) => {
                const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
                
                const formatTime = (secs) => {
                    if (!secs || isNaN(secs) || secs < 0) return "00:00";
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                };

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