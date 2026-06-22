import fs from 'fs';
import path from 'path';

export const LocalProvider = {
    name: 'Lokale Festplatte',
    
    async getStream(trackName, rootDir) {
        // Findet den Musik-Ordner relativ zum Hauptverzeichnis der App
        const musicFolder = path.join(rootDir, 'music');
        let filePath = path.join(musicFolder, `${trackName}.opus`);
        
        // Fallback auf MP3, falls die zukunftssichere Opus-Datei fehlt
        if (!fs.existsSync(filePath)) {
            filePath = path.join(musicFolder, `${trackName}.mp3`);
        }

        if (fs.existsSync(filePath)) {
            return {
                type: 'local_file',
                filePath: filePath
            };
        }
        
        return null; // Nichts lokal gefunden, nächster Provider ist dran
    }
};