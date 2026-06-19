// modules/player.js
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    currentPlayback: null,
    logStream: null,

    /**
     * Probes the media target asynchronously to extract total duration in seconds
     */
    getDuration: function(target, callback) {
        const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${target}"`;
        exec(cmd, (err, stdout) => {
            if (err) return callback(0);
            const duration = parseFloat(stdout.trim());
            callback(isNaN(duration) ? 0 : duration);
        });
    },

    play: function(target, callback, onProgress) {
        this.stop();
        console.log(`[Elysium Player] Initializing audio driver with active debug logging...`);

        const cacheDir = './.cache';
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const logPath = path.join(cacheDir, 'player_debug.log');
        this.logStream = fs.createWriteStream(logPath, { flags: 'w' });
        
        this.logStream.write(`=== ELYSIUM PLAYER DEBUG LOG - START: ${new Date().toISOString()} ===\n`);
        this.logStream.write(`Target URL/Path: ${target}\n\n`);

        // Extract duration first, then spawn the stream
        this.getDuration(target, (totalDuration) => {
            const isNetworkStream = target.startsWith('http://') || target.startsWith('https://');
            let args = ['-nodisp', '-autoexit'];

            if (isNetworkStream) {
                args.push(
                    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    '-reconnect', '1',
                    '-reconnect_streamed', '1',
                    '-reconnect_delay_max', '5'
                );
            }

            args.push(target);
            this.currentPlayback = spawn('ffplay', args);

            let lastEmittedSecond = -1;

            // Parse live playback output from ffplay's stderr
            this.currentPlayback.stderr.on('data', (data) => {
                if (this.logStream) this.logStream.write(data);
                
                const chunk = data.toString();
                // Regex traps ffplay timestamp rendering format (e.g. "  4.21 A-V:")
                const match = chunk.match(/([\d.]+)\s+(?:A-V|M-A)/i);
                
                if (match && match[1]) {
                    const currentTime = parseFloat(match[1]);
                    const currentSecond = Math.floor(currentTime);
                    
                    if (currentSecond !== lastEmittedSecond) {
                        lastEmittedSecond = currentSecond;
                        if (onProgress) onProgress(currentSecond, Math.round(totalDuration));
                    }
                }
            });

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