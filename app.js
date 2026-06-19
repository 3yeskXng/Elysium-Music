// app.js
const readline = require('readline');
const core = require('./core.js');

// Create the terminal interface input stream
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ELYSIUM> '
});

console.log("==================================================");
console.log("🎵 Welcome to Elysium Music Command Line Interface");
console.log("Type 'play <song name>' to listen to music.");
console.log("Type 'stop' to halt playback.");
console.log("Type 'exit' to close the application.");
console.log("==================================================\n");

// Open the prompt loop
rl.prompt();

rl.on('line', async (line) => {
    const input = line.trim();
    
    // Split input into command and arguments (e.g., "play linkin park" -> cmd: "play", args: "linkin park")
    const spaceIndex = input.indexOf(' ');
    const command = spaceIndex !== -1 ? input.substring(0, spaceIndex).toLowerCase() : input.toLowerCase();
    const args = spaceIndex !== -1 ? input.substring(spaceIndex + 1) : '';

    switch (command) {
        case 'exit':
            console.log("[Elysium] Shutting down systems. Goodbye!");
            
            // Access the lazy-loaded player through the core architecture to clean up processes
            try {
                const player = core._getPlugin('player');
                player.stop();
            } catch (e) { /* Player wasn't loaded yet, safe to ignore */ }
            
            process.exit(0);
            break;

        case 'stop':
            console.log("[Elysium] Requesting playback stop...");
            try {
                const player = core._getPlugin('player');
                player.stop();
                console.log("[Elysium] Playback halted successfully.");
            } catch (e) {
                console.log("[Elysium] No active player module running in memory.");
            }
            break;

        case 'play':
            if (!args) {
                console.log("[Elysium] Error: Please specify a song name. Example: play Linkin Park");
                break;
            }
            
            // Fire and forget: We do NOT await here! 
            // This is Lever 4 (Parallelization) in action. The UI prompt returns immediately 
            // while the core fetches and plays the audio in the background!
            core.play(args).then(() => {
                // Re-prompt when the song finishes naturally
                rl.prompt();
            });
            break;

        default:
            console.log(`[Elysium] Unknown command: "${command}". Available commands: play <name>, stop, exit`);
            break;
    }

    // Instantly bring back the prompt so the user can type while the song is loading/playing!
    rl.prompt();
}).on('close', () => {
    console.log('\n[Elysium] Session closed.');
    process.exit(0);
});

// app.js (Add this at the very bottom of the file)

// Capture Ctrl+C (SIGINT) and clean up zombie audio processes before exiting
process.on('SIGINT', () => {
    console.log('\n[Elysium] Forced shutdown detected. Cleaning up audio processes...');
    try {
        const player = core._getPlugin('player');
        player.stop();
    } catch (e) {}
    process.exit(0);
});