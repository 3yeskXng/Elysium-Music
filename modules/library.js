// modules/library.js
const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * Scans the download directory for any existing .opus files that match the query
     * @param {string} searchQuery 
     * @param {string} downloadDir 
     * @returns {string|null} Full path to the file, or null if no match
     */
    findLocalTrack: function(searchQuery, downloadDir) {
        if (!fs.existsSync(downloadDir)) return null;

        // Filter for native high-quality opus containers
        const files = fs.readdirSync(downloadDir).filter(file => file.endsWith('.opus'));
        const queryWords = searchQuery.toLowerCase().split(' ');

        for (const file of files) {
            const fileNameLower = file.toLowerCase();
            
            // Check if every word from the search query exists in the filename
            const match = queryWords.every(word => fileNameLower.includes(word));
            if (match) {
                return path.join(downloadDir, file);
            }
        }
        return null;
    }
};