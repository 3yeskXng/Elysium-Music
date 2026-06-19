// modules/downloader.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
    downloadTrack: function(searchQuery, downloadDir) {
        return new Promise((resolve, reject) => {
            console.log(`[Engine: Downloader] Pulling native high-quality Opus audio track container...`);
            
            const command = `yt-dlp -x --audio-format opus -o "${downloadDir}/%(title)s.%(ext)s" "ytsearch1:${searchQuery}"`;

            exec(command, (error) => {
                if (error) return reject(error);
                
                // Let's find the freshly downloaded file to pass the exact path back to the core
                const files = fs.readdirSync(downloadDir);
                // Sort by newest file to catch the current download
                const newestFile = files
                    .map(file => ({ name: file, time: fs.statSync(path.join(downloadDir, file)).mtime.getTime() }))
                    .sort((a, b) => b.time - a.time)[0];

                if (newestFile) {
                    resolve(path.join(downloadDir, newestFile.name));
                } else {
                    reject(new Error("Downloaded file not found on disk."));
                }
            });
        });
    }
};