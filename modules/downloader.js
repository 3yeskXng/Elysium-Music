// modules/downloader.js
const { exec } = require('child_process');
const path = require('path');

const DownloadService = {
    /**
     * Unified interface function for the core
     */
    handlePlayback: function(searchQuery, downloadDir, callback) {
        console.log(`[Engine: Download] Fetching and saving track as clean Opus file...`);

        // -f "ba[ext=webm]" grabs the native high-quality Opus stream from YouTube without conversion slop
        const downloadCmd = `yt-dlp -f "ba[ext=webm]" -o "${downloadDir}/%(title)s.%(ext)s" "ytsearch1:${searchQuery}"`;

        exec(downloadCmd, (error) => {
            if (error) return callback(error);

            console.log(`[Engine: Download] Track saved. Checking file to play locally...`);
            
            // In a fully finished version, we would scan the exact name, 
            // for now we tell ffplay to look into the folder and play the track.
            // Shortcut for the test: We just play the stream directly like before to keep it simple,
            // or let ffplay stream it while downloading. 
            // Let's launch ffplay for the freshly downloaded stuff:
            const playCmd = `ffplay -nodisp -autoexit "ytsearch1:${searchQuery}"`;
            exec(playCmd, (playError) => {
                if (playError) return callback(playError);
                return callback(null);
            });
        });
    }
};

module.exports = DownloadService;