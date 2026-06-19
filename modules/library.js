// modules/library.js
const fs = require('fs');
const path = require('path');

/**
 * Service module to manage and scan the local music library
 */
const LibraryService = {
    
    /**
     * Scans the download directory and returns a list of supported audio files
     * @param {string} dirPath - Path to the downloads directory
     * @returns {string[]} Array of audio file names
     */
    scanLibrary: function(dirPath) {
        // If the directory doesn't exist yet, return an empty library
        if (!fs.existsSync(dirPath)) {
            return [];
        }

        // Read all files inside the directory
        const allFiles = fs.readdirSync(dirPath);

        // Filter files to only include .mp3 or .m4a formats
        const audioFiles = allFiles.filter(file => {
            const fileExtension = path.extname(file).toLowerCase();
            return fileExtension === '.mp3' || fileExtension === '.m4a';
        });

        return audioFiles;
    }
};

// Export the module so the Core can use it
module.exports = LibraryService;