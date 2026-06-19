// modules/player.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    currentPlayback: null,
    logStream: null,

    play: function(target, callback) {
        this.stop();
        console.log(`[Elysium Player] Initializing audio driver with active debug logging...`);

        const cacheDir = './.cache';
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const logPath = path.join(cacheDir, 'player_debug.log');
        this.logStream = fs.createWriteStream(logPath, { flags: 'w' });
        
        this.logStream.write(`=== ELYSIUM PLAYER DEBUG LOG - START: ${new Date().toISOString()} ===\n`);
        this.logStream.write(`Target URL/Path: ${target}\n\n`);

        // Check if the target is a network stream or a local file container
        const isNetworkStream = target.startsWith('http://') || target.startsWith('https://');

        // Base arguments needed for every playback type
        let args = ['-nodisp', '-autoexit'];

        if (isNetworkStream) {
            // Apply network-only protocol options to bypass YouTube throttling mechanisms
            args.push(
                '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '-reconnect', '1',
                '-reconnect_streamed', '1',
                '-reconnect_delay_max', '5'
            );
        }

        // Append the target file path or streaming URL at the very end
        args.push(target);

        this.currentPlayback = spawn('ffplay', args);

        this.currentPlayback.stderr.pipe(this.logStream);
        this.currentPlayback.stdout.pipe(this.logStream);

        this.currentPlayback.on('close', (code) => {
            if (this.logStream) {
                this.logStream.write(`\n=== PLAYBACK PROCESS CLOSED WITH CODE: ${code} ===\n`);
                this.logStream.end();
                this.logStream = null;
            }
            this.currentPlayback = null;
            return callback(null);
        });

        this.currentPlayback.on('error', (err) => {
            if (this.logStream) {
                this.logStream.write(`\n=== PROCESS CRASHED: ${err.message} ===\n`);
                this.logStream.end();
                this.logStream = null;
            }
            this.currentPlayback = null;
            return callback(err);
        });
    },

    stop: function() {
        if (this.currentPlayback) {
            console.log("[Elysium Player] Killing active playback process...");
            this.currentPlayback.kill('SIGKILL');
            this.currentPlayback = null;
        }
        if (this.logStream) {
            this.logStream.write(`\n=== PLAYBACK INTERRUPTED BY USER ===\n`);
            this.logStream.end();
            this.logStream = null;
        }
    }
};