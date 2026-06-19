// modules/player.js
const { exec } = require('child_process');
const path = require('path');

const PlayerService = {
    currentPlayback: null,

    play: function(filePath, callback) {
        this.stop();

        console.log(`[Elysium Player] Now playing: "${path.basename(filePath)}"`);
        const command = `ffplay -nodisp -autoexit "${filePath}"`;

        this.currentPlayback = exec(command, (error, stdout, stderr) => {
            this.currentPlayback = null;
            if (error && !error.killed) {
                return callback(error);
            }
            return callback(null);
        });
    },

    stop: function() {
        if (this.currentPlayback) {
            console.log("[Elysium Player] Stopping playback...");
            this.currentPlayback.kill();
            this.currentPlayback = null;
        }
    }
};

// CHECK THIS LINE CAREFULLY: Must have an 's' at the end of exports!
module.exports = PlayerService;