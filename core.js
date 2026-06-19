// core.js
const fs = require('fs');

// Import our modular services
const downloader = require('./modules/downloader.js'); 
const library = require('./modules/library.js'); 
const player = require('./modules/player.js'); 
const streamer = require('./modules/streamer.js'); // Our brand new streaming module!

const DOWNLOAD_DIR = './downloads';
if (!fs.existsSync(DOWNLOAD_DIR)){
    fs.mkdirSync(DOWNLOAD_DIR);
}

/**
 * Main Elysium Core Orchestrator
 */
const ElysiumCore = {
    
    // ... (local library code remains untouched) ...

    /**
     * Streams a song instantly from the internet without saving it to disk
     * @param {string} trackName - Name of the song to stream
     */
    streamTrack: function(trackName) {
        console.log(`[Elysium Core] Instant stream requested for: "${trackName}"`);

        // Step 1: Get the hidden streaming link
        streamer.getStreamUrl(trackName, (error, streamUrl) => {
            if (error) {
                console.error(`[Elysium Core] Failed to get stream URL: ${error.message}`);
                return;
            }

            console.log(`[Elysium Core] Stream URL obtained successfully.`);
            
            // Step 2: Feed the live web-URL directly into our existing player!
            player.play(streamUrl, (playError) => {
                if (playError) {
                    console.error(`[Elysium Core] Streaming playback error: ${playError.message}`);
                    return;
                }
                console.log("[Elysium Core] Streaming finished.");
            });
        });
    }
};

// --- TEST RUN ---
// Let's test the instant streaming with a high-energy track!
ElysiumCore.streamTrack("DaHool Meet Her At The Loveparade");