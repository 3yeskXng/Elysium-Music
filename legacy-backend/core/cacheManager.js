import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

// Cache-Ordner liegt im Hauptverzeichnis von Elysium-Music
const CACHE_DIR = path.resolve('./cache'); 
const TTL_DAYS = 3; // Time-to-Live: Nach wie vielen Tagen soll gelöscht werden?

// Sicherstellen, dass der Cache-Ordner existiert
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Wandelt Songnamen in sichere Dateinamen um (entfernt Sonderzeichen wie ?, /, : etc.)
function getSafeFilename(trackName) {
    return trackName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() + '.opus';
}

export const CacheManager = {
    /**
     * Prüft, ob ein Song bereits im Cache liegt
     */
    has(trackName) {
        const filePath = path.join(CACHE_DIR, getSafeFilename(trackName));
        return fs.existsSync(filePath);
    },

    /**
     * Gibt einen direkten Lese-Stream der lokalen Datei zurück (Blitzschnell)
     */
    getLocalStream(trackName) {
        const filePath = path.join(CACHE_DIR, getSafeFilename(trackName));
        return fs.createReadStream(filePath);
    },

    /**
     * T-Stück Pipeline: Verdoppelt den YouTube-Stream live an die UI UND auf die Festplatte
     */
    createCachePipeline(trackName, remoteStream, writeToLogFile) {
        const fileName = getSafeFilename(trackName);
        const filePath = path.join(CACHE_DIR, fileName);
        
        writeToLogFile('CACHE_PIPE_START', `Erstelle Simultan-Pipeline für: ${fileName}`);

        const passThrough = new PassThrough();
        const fileWriteStream = fs.createWriteStream(filePath);

        // Das T-Stück: Remote-Daten splitten
        remoteStream.pipe(passThrough); // Stream zur UI
        remoteStream.pipe(fileWriteStream); // Stream zur Festplatte

        fileWriteStream.on('finish', () => {
            writeToLogFile('CACHE_WRITE_SUCCESS', `Erfolgreich im Cache abgelegt: ${fileName}`);
        });

        fileWriteStream.on('error', (err) => {
            writeToLogFile('CACHE_WRITE_FAIL', `Fehler beim Schreiben in den Cache`, err.message);
            // Falls das Schreiben fehlschlägt, löschen wir Fragmente, damit der Cache sauber bleibt
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        return passThrough;
    },

    /**
     * Der automatische Müllschlucker: Löscht Dateien, die älter als TTL_DAYS sind
     */
    autoCleanup(writeToLogFile) {
        writeToLogFile('CACHE_CLEANUP_START', `Prüfe Cache auf Dateien älter als ${TTL_DAYS} Tage...`);
        
        fs.readdir(CACHE_DIR, (err, files) => {
            if (err) return;
            const now = Date.now();
            const maxAgeMs = TTL_DAYS * 24 * 60 * 60 * 1000;

            files.forEach(file => {
                const filePath = path.join(CACHE_DIR, file);
                fs.stat(filePath, (statErr, stats) => {
                    if (statErr) return;
                    
                    // Prüfe das Änderungsdatum der Datei
                    if (now - stats.mtimeMs > maxAgeMs) {
                        fs.unlink(filePath, (unlinkErr) => {
                            if (!unlinkErr) {
                                writeToLogFile('CACHE_CLEANUP_DEL', `Müllschlucker aktiv: ${file} automatisch gelöscht.`);
                            }
                        });
                    }
                });
            });
        });
    }
};