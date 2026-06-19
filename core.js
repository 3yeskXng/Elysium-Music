// core.js
const fs = require('fs');
const path = require('path');

// Import our custom modules
const downloader = require('./modules/downloader.js'); 
const library = require('./modules/library.js'); 
const player = require('./modules/player.js'); // Our brand new player module!

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
    
    // ... download logic stays here, but we focus on playing right now ...

    /**
     * Plays a specific song from the local library by its index (starting at 1)
     * @param {number} index - The song number from the library list
     */
    playLocalTrack: function(index) {
        const tracks = library.scanLibrary(DOWNLOAD_DIR);
        
        if (tracks.length === 0) {
            console.log("[Elysium Core] Cannot play. Library is empty!");
            return;
        }

        // Arrays start at 0, so track [1] is index 0
        const trackName = tracks[index - 1];

        if (!trackName) {
            console.log(`[Elysium Core] Track index [${index}] not found.`);
            return;
        }

        // Construct the full path to the file (e.g., ./downloads/song.mp3)
        const fullPath = path.join(DOWNLOAD_DIR, trackName);

        // Tell the player module to run the file
        player.play(fullPath, (error) => {
            if (error) {
                console.error(`[Elysium Core] Playback error: ${error.message}`);
                return;
            }
            console.log("[Elysium Core] Playback finished.");
        });
    }
};

// --- TEST RUN ---
// 1. First, show us what we have
const tracks = library.scanLibrary(DOWNLOAD_DIR);
console.log(`[Elysium Core] Loaded library. Found ${tracks.length} tracks.`);

// 2. Play the first song! (Change the number to 2 if you want to play the second song)
ElysiumCore.playLocalTrack(1);