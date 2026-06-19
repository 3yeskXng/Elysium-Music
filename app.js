// app.js
const readline = require('readline');
const core = require('./core.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ELYSIUM> '
});

console.log("==================================================");
console.log("🎵 Welcome to Elysium Music Command Line Interface");
console.log("Commands: play <name> | add <name> | queue | stop | exit");
console.log("==================================================\n");

rl.prompt();

// Helper flag to prevent overlapping playback loops
let isProcessingQueue = false;

async function checkQueueLoop() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    const queue = core._getPlugin('queue');
    let nextTrack = queue.dequeue();

    while (nextTrack !== null) {
        // Await the playback to completely finish before moving to the next loop iteration
        await core.play(nextTrack);
        nextTrack = queue.dequeue();
    }

    isProcessingQueue = false;
}

rl.on('line', async (line) => {
    const input = line.trim();
    const spaceIndex = input.indexOf(' ');
    const command = spaceIndex !== -1 ? input.substring(0, spaceIndex).toLowerCase() : input.toLowerCase();
    const args = spaceIndex !== -1 ? input.substring(spaceIndex + 1) : '';

    const queue = core._getPlugin('queue');
    const player = core._getPlugin('player');

    switch (command) {
        case 'exit':
            console.log("[Elysium] Shutting down systems. Goodbye!");
            try { player.stop(); } catch (e) {}
            process.exit(0);
            break;

        case 'stop':
            console.log("[Elysium] Requesting playback stop...");
            try {
                queue.clear(); // Empty queue on explicit stop request
                player.stop();
            } catch (e) {}
            break;

        case 'play':
            if (!args) {
                console.log("[Elysium] Error: Please specify a song name.");
                break;
            }
            try { player.stop(); } catch (e) {} // Interrupt current song
            queue.clear();
            queue.enqueue(args);
            checkQueueLoop(); // Fire and forget into background thread execution boundary
            break;

        case 'add':
            if (!args) {
                console.log("[Elysium] Error: Please specify a song name to add.");
                break;
            }
            queue.enqueue(args);
            checkQueueLoop(); // Triggers the loop if it's not already running
            break;

        case 'queue':
            const list = queue.getTracks();
            if (list.length === 0) {
                console.log("[Elysium] The queue is currently empty.");
            } else {
                console.log("\n--- Current Queue Lineup ---");
                list.forEach((track, index) => {
                    console.log(`${index + 1}. ${track}`);
                });
                console.log("----------------------------\n");
            }
            break;

        default:
            console.log(`[Elysium] Unknown command: "${command}"`);
            break;
    }

    rl.prompt();
});

process.on('SIGINT', () => {
    console.log('\n[Elysium] Forced shutdown detected. Cleaning up...');
    try { core._getPlugin('player').stop(); } catch (e) {}
    process.exit(0);
});