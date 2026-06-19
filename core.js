// core.js
const fs = require('fs');

// Import our custom modules
const downloader = require('./modules/downloader.js'); 
const library = require('./modules/library.js'); 

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
            
            // Print the updated library after a successful download
            this.printLibrary();
        });
    },

    /**
     * Fetches the local library from the storage module and prints it beautifully
     */
    printLibrary: function() {
        console.log(`[Elysium Core] Requesting local library scan...`);
        const tracks = library.scanLibrary(DOWNLOAD_DIR);
        
        console.log(`\n--- 🎵 ELYSIUM LOCAL LIBRARY (${tracks.length} Tracks) ---`);
        if (tracks.length === 0) {
            console.log("   (Your library is empty. Try downloading a song!)");
        } else {
            tracks.forEach((track, index) => {
                console.log(`   [${index + 1}] ${track}`);
            });
        }
        console.log(`---------------------------------------------------\n`);
    }
};

// --- TEST RUN ---
// Instead of downloading a new song, we now test our new library system!
ElysiumCore.printLibrary();

// If you want to download a new song, just uncomment the line below:
// ElysiumCore.requestTrack("Matrix Clubbed to Death");