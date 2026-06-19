// modules/player.js
const { spawn } = require('child_process');

module.exports = {
    currentPlayback: null,

    play: function(target, callback) {
        this.stop();
        console.log(`[Elysium Player] Initializing hardware audio driver...`);

        // Using spawn instead of exec to prevent buffer overflows (fixes the 1-minute crash)
        this.currentPlayback = spawn('ffplay', ['-nodisp', '-autoexit', target]);

        this.currentPlayback.on('close', (code) => {
            this.currentPlayback = null;
            // Code 0 or null means it exited normally or was killed intentionally
            return callback(null);
        });

        this.currentPlayback.on('error', (err) => {
            this.currentPlayback = null;
            return callback(err);
        });
    },

    stop: function() {
        if (this.currentPlayback) {
            console.log("[Elysium Player] Killing active playback process...");
            this.currentPlayback.kill('SIGKILL'); // Force kill the process tree element
            this.currentPlayback = null;
        }
    }
};