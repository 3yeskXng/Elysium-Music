// modules/streamer.js
const { exec } = require('child_process');

const StreamerService = {
    /**
     * Unified interface function for the core
     */
    handlePlayback: function(searchQuery, downloadDir, callback) {
        console.log(`[Engine: Stream] Fetching live Opus/WebM stream URL...`);

        // Fetch direct link
        const getUrlCmd = `yt-dlp -f ba -g "ytsearch1:${searchQuery}"`;

        exec(getUrlCmd, (error, stdout) => {
            if (error) return callback(error);

            const streamUrl = stdout.trim();
            console.log(`[Engine: Stream] Launching instant playback via ffplay...`);
            
            // Play instantly
            const playCmd = `ffplay -nodisp -autoexit "${streamUrl}"`;
            exec(playCmd, (playError) => {
                if (playError) return callback(playError);
                return callback(null);
            });
        });
    }
};

module.exports = StreamerService;