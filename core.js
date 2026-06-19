// core.js
const fs = require('fs');
const path = require('path');

// 1. Read the configuration file dynamically
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// 2. Dynamically load the active engine based on config
const Engine = require(`./modules/${config.activeEngine}.js`);

/**
 * Universal Elysium Core
 */
const ElysiumCore = {
    /**
     * Executes playback using the configured dynamic engine
     * @param {string} trackQuery - The song name or search term
     */
    play: function(trackQuery) {
        if (!trackQuery) {
            console.error("[Elysium Core] Error: No song title provided!");
            return;
        }

        console.log(`[Elysium Core] Starting engine [${config.activeEngine}] for: "${trackQuery}"`);
        
        Engine.handlePlayback(trackQuery, config.downloadDir, (error) => {
            if (error) {
                console.error(`[Elysium Core] Playback failed: ${error.message}`);
                return;
            }
            console.log("[Elysium Core] Execution finished.\n");
        });
    }
};

// 3. Export the core so you can control it from anywhere
module.exports = ElysiumCore;

// --- DYNAMIC RUNTIME LINK ---
// We read the song title directly from the command line argument now!
const userTrack = process.argv.slice(2).join(' ');
if (userTrack) {
    ElysiumCore.play(userTrack);
} else {
    console.log("[Elysium] Ready. Usage: node core.js <Songname>");
}