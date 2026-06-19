// core.js
const fs = require('fs');

/**
 * Universal Elysium Core Orchestrator
 * This core is completely independent of the underlying modules!
 */
class ElysiumCore {
    /**
     * @param {Object} config 
     * @param {Object} config.audioService - The module used for playing/streaming
     * @param {string} config.downloadDir - Path for downloads (if needed)
     */
    constructor(config) {
        this.audioService = config.audioService;
        this.downloadDir = config.downloadDir || './downloads';

        // Ensure download directory exists
        if (!fs.existsSync(this.downloadDir)){
            fs.mkdirSync(this.downloadDir);
        }
        console.log("[Elysium Core] System initialized with custom engine.");
    }

    /**
     * Plays a track using whatever service was injected into the core
     * @param {string} trackQuery - Song name, URL or file path
     */
    play(trackQuery) {
        console.log(`\n[Elysium Core] Processing playback request for: "${trackQuery}"`);
        
        // The core doesn't care IF it streams or downloads. 
        // It just tells the module: "Do your job and play this!"
        this.audioService.handlePlayback(trackQuery, this.downloadDir, (error) => {
            if (error) {
                console.error(`[Elysium Core] Playback failed: ${error.message}`);
                return;
            }
            console.log("[Elysium Core] Playback finished cleanly.\n");
        });
    }
}

// =====================================================================
// --- CONFIGURATION & RUNTIME (Hier entscheidest DU, was passiert) ---
// =====================================================================

// 1. Load our flexible engines
const StreamingEngine = require('./modules/streamer.js');
const DownloadEngine  = require('./modules/downloader.js'); // Wir passen die Module gleich an!

/**
 * WÄHLE HIER DEINEN MODUS:
 * Tausche einfach "StreamingEngine" gegen "DownloadEngine" aus!
 */
const activeEngine = StreamingEngine; 

// 2. Start the core with the selected engine
const elysium = new ElysiumCore({
    audioService: activeEngine,
    downloadDir: './downloads'
});

// 3. Fire it up!
elysium.play("DaHool Meet Her At The Loveparade");