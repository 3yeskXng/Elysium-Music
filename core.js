// Import the native Node.js module to execute command-line tools
const { exec } = require('child_process');

/**
 * Downloads the audio from a YouTube URL and converts it to MP3
 * @param {string} url - The YouTube video URL
 */
function downloadAudio(url) {
    console.log("[Elysium Core] Initializing download process...");

    // Command for yt-dlp: extract audio (-x), convert to mp3, template for file name
    // We wrap the URL in double quotes to prevent errors with special characters
    const command = `yt-dlp -x --audio-format mp3 -o "%(title)s.%(ext)s" "${url}"`;

    // Execute the command in the background
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Elysium Core] Error during download: ${error.message}`);
            return;
        }
        
        console.log("[Elysium Core] Success! Track downloaded and converted.");
    });
}

// --- TEST RUN ---
// We test the core functionality with a classic internet anthem
const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; 
downloadAudio(testUrl);