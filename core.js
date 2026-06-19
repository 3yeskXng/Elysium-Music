// Import native Node.js modules
const { exec } = require('child_process');
const fs = require('fs');

// Ensure the downloads directory exists right at the start
const downloadDir = './downloads';
if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
}

/**
 * Searches YouTube for a track and downloads the best audio match
 * @param {string} searchQuery - The song name or keywords to search for
 */
function downloadBySearch(searchQuery) {
    console.log(`[Elysium Core] Searching and downloading: "${searchQuery}"...`);

    // ytsearch1: tells yt-dlp to take the very first result from YouTube search
    // We save the file directly into our clean /downloads folder
    const command = `yt-dlp -x --audio-format mp3 -o "${downloadDir}/%(title)s.%(ext)s" "ytsearch1:${searchQuery}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Elysium Core] Error during search/download: ${error.message}`);
            return;
        }
        
        console.log(`[Elysium Core] Ready! "${searchQuery}" is now safe in your downloads folder.`);
    });
}

// --- TEST RUN ---
// Now we test it with a real song name instead of a cryptic URL!
downloadBySearch("Linkin Park Numb");