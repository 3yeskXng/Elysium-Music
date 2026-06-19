// modules/downloader.js
const { exec } = require('child_process');

/**
 * Service module to interact with YouTube via yt-dlp
 */
const DownloaderService = {
    
    /**
     * Downloads a track by search query and saves it to a specific path
     * @param {string} searchQuery - The song to search for
     * @param {string} outputPath - Where to save the final MP3 file
     * @param {function} callback - Function to call when finished (success or error)
     */
    downloadBySearch: function(searchQuery, outputPath, callback) {
        // ytsearch1 takes the first YouTube result
// Alt: const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}/%(title)s.%(ext)s" "ytsearch1:${searchQuery}"`;

// NEU (Superschnell, direkt Opus!):
const command = `yt-dlp -f "ba[ext=webm]" -o "${outputPath}/%(title)s.%(ext)s" "ytsearch1:${searchQuery}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return callback(error, null);
            }
            return callback(null, "Download complete");
        });
    }
};

// Export the module so the Core can use it
module.exports = DownloaderService;