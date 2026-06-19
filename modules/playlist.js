// modules/playlist.js
const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * Reads a local text file from the playlists directory and extracts track queries
     * @param {string} name 
     * @returns {string[]|null} Array of track queries, or null if file missing
     */
    readPlaylist: function(name) {
        const playlistDir = path.join(__dirname, '../playlists');
        
        // Auto-create directory if it doesn't exist yet
        if (!fs.existsSync(playlistDir)) {
            fs.mkdirSync(playlistDir, { recursive: true });
        }

        const filePath = path.join(playlistDir, `${name}.txt`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        // Split by line, trim spaces, drop empty lines and comments
        return content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
    }
};