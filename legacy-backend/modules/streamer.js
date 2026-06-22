// modules/streamer.js
const { exec } = require('child_process');

module.exports = {
    getStreamUrl: function(searchQuery) {
        return new Promise((resolve, reject) => {
            console.log(`[Engine: Streamer] Resolving live streaming payload URL via yt-dlp...`);
            const command = `yt-dlp -f ba -g "ytsearch1:${searchQuery}"`;

            exec(command, (error, stdout) => {
                if (error) return reject(error);
                resolve(stdout.trim());
            });
        });
    }
};