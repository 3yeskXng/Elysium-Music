// modules/streamer.js
const { exec } = require('child_process');

/**
 * Service module to fetch direct audio stream URLs from YouTube
 */
const StreamerService = {

    /**
     * Gets the direct streaming URL for a search query
     * @param {string} searchQuery - The song name to search for
     * @param {function} callback - Returns (error, streamUrl)
     */
    getStreamUrl: function(searchQuery, callback) {
        console.log(`[Elysium Streamer] Fetching live stream URL for: "${searchQuery}"...`);

        // -f ba: select "best audio" only (makes it ultra lightweight and fast)
        // -g: get URL instead of downloading
        const command = `yt-dlp -f ba -g "ytsearch1:${searchQuery}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return callback(error, null);
            }

            // stdout contains the long URL. We trim it to remove any accidental newlines
            const streamUrl = stdout.trim();
            return callback(null, streamUrl);
        });
    }
};

module.exports = StreamerService;