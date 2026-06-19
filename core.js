// core.js
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events'); // Native Node.js Event Broker

class ElysiumCore extends EventEmitter {
    constructor() {
        super(); // Initialize EventEmitter capabilities
        this.config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        this.plugins = {};
        this.cacheFile = './.cache/stream_cache.json';
        this.cache = {};
        
        this.isProcessingQueue = false;
        this.forceSkip = false;

        if (!fs.existsSync(this.config.downloadDir)) fs.mkdirSync(this.config.downloadDir, { recursive: true });
        if (!fs.existsSync('./.cache')) fs.mkdirSync('./.cache', { recursive: true });

        this._autoloadPlugins();
        this._loadCache();
    }

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
        if (!plugin) throw new Error(`Plugin "${name}" missing.`);
        if (!plugin.instance) plugin.instance = require(plugin.filePath);
        return plugin.instance;
    }

    /**
     * UI-Ready Command: Enqueue a track and automatically handle the loop
     */
    enqueue(trackQuery) {
        const queue = this._getPlugin('queue');
        queue.enqueue(trackQuery);
        this.emit('queueChanged', queue.getTracks());
        this._processQueueLoop();
    }

    /**
     * UI-Ready Command: Instantly interrupt the active song and proceed
     */
    skip() {
        this.forceSkip = true;
        try { this._getPlugin('player').stop(); } catch (e) {}
    }

    /**
     * UI-Ready Command: Halt everything completely
     */
    stopAll() {
        try {
            this._getPlugin('queue').clear();
            this._getPlugin('player').stop();
            this.emit('queueChanged', []);
        } catch (e) {}
    }

    /**
     * Core Queue Loop - Runs entirely decoupled from the view layer
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

    async _playTrack(trackQuery) {
        const engineName = this.config.defaultEngine;
        const i18n = this._getPlugin('i18n');

        if (engineName === 'streamer' && this.cache[trackQuery]) {
            const cached = this.cache[trackQuery];
            if (Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
                this.emit('statusMessage', i18n.t('track_started') + `"${trackQuery}"`);
                return this._executePlayback(cached.url);
            }
        }

        try {
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
        } catch (error) {
            this.emit('error', error.message);
        }
    }

    async _executePlayback(target) {
        const player = this._getPlugin('player');
        return new Promise((resolve) => {
            player.play(target, () => {
                resolve();
            });
        });
    }
}

module.exports = new ElysiumCore();