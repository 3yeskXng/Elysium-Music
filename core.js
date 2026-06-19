// core.js
const fs = require('fs');

// FIXED: Corrected the path to our custom downloader module
const downloader = require('./modules/downloader.js'); 

// Core configuration
const DOWNLOAD_DIR = './downloads';

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)){
    fs.mkdirSync(DOWNLOAD_DIR);
}

/**
 * Main Elysium Core Orchestrator
 */
const ElysiumCore = {
    
    /**
     * High-level function to request a song download
     * @param {string} trackName - Name of the song
     */
    requestTrack: function(trackName) {
        console.log(`[Elysium Core] User requested: "${trackName}". Handing over to Downloader Module...`);
        
        downloader.downloadBySearch(trackName, DOWNLOAD_DIR, (error, result) => {
            if (error) {
                console.error(`[Elysium Core] Task failed: ${error.message}`);
                return;
            }
            console.log(`[Elysium Core] Task successful! Message: ${result}`);
        });
    }
};

// --- TEST RUN ---
// Let's test our modular system with a classic track!
ElysiumCore.requestTrack("Abba Dancing Queen");