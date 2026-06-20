import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ytSearch from 'yt-search';
import play from 'play-dl'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; 

app.use(cors());
app.use(express.json());

let playerState = {
    currentTrack: "Kein Track geladen", 
    duration: 0,            
    currentSeconds: 0,        
    isPaused: true            
};

setInterval(() => {
    if (!playerState.isPaused && playerState.currentSeconds < playerState.duration) {
        playerState.currentSeconds++;
    }
}, 1000);

app.get('/api/status', (req, res) => res.json(playerState));

app.post('/api/play-track', (req, res) => {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Kein Track angegeben' });
    playerState.currentTrack = track;
    playerState.currentSeconds = 0;
    playerState.duration = 180; 
    playerState.isPaused = false;
    console.log(`[Core] UI fordert Song an: "${track}"`);
    res.json(playerState);
});

app.post('/api/pause', (req, res) => {
    playerState.isPaused = !playerState.isPaused;
    console.log(`[Core] Status geändert: ${playerState.isPaused ? '⏸ PAUSE' : '▶ WIEDERGABE'}`);
    res.json(playerState);
});

app.post('/api/skip', (req, res) => {
    playerState.currentTrack = "Kein Track geladen";
    playerState.currentSeconds = 0;
    playerState.duration = 0;
    playerState.isPaused = true;
    res.json(playerState);
});

/**
 * 5. HYBRID-AUDIO-STREAMING (Absolut crash-sicher)
 */
app.get('/api/audio', async (req, res) => {
    const trackName = req.query.track;
    if (!trackName) return res.status(400).send('Kein Track angegeben.');

    const musicFolder = path.join(__dirname, 'music');
    let filePath = path.join(musicFolder, `${trackName}.opus`);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(musicFolder, `${trackName}.mp3`);
    }

    if (fs.existsSync(filePath)) {
        console.log(`[Core] Spiele lokale Datei: ${trackName}`);
        return res.sendFile(filePath);
    }

    // --- YOUTUBE FALLBACK ---
    try {
        console.log(`[Core] "${trackName}" nicht lokal. Suche auf YouTube...`);
        const searchResults = await ytSearch(trackName);
        const video = searchResults.videos[0];
        
        if (!video) {
            console.log(`[Core] Nichts auf YouTube gefunden.`);
            return res.status(404).send('Song nirgends gefunden.');
        }

        console.log(`[Core] Versuche Stream aufzubauen für: "${video.title}"`);
        playerState.currentTrack = video.title;
        playerState.duration = video.seconds || 180;

        // BROWSER-SPOOFING: Wir füttern play-dl mit echten Browser-Informationen,
        // damit YouTube die Anfrage nicht als Bot blockiert (verhindert den 403 / Invalid URL Fehler)
        const youtubeStream = await play.stream(video.url, {
            quality: 2, // Beste Audioqualität (Natives Opus/WebM)
            htmAgent: play.userAgent
        }).catch(err => {
            throw new Error(`YouTube-Sperre aktiv: ${err.message}`);
        });

        if (!youtubeStream || !youtubeStream.stream) {
            throw new Error("Stream konnte nicht extrahiert werden (URL ungültig).");
        }

        // Header setzen, damit Tauri weiß, welcher Audio-Typ ankommt
        res.setHeader('Content-Type', youtubeStream.type || 'audio/webm');
        
        // Den Stream fehlerfrei an die Pipe übergeben
        youtubeStream.stream.on('error', (streamErr) => {
            console.error('[Stream-Pipe Fehler]:', streamErr.message);
        });

        youtubeStream.stream.pipe(res);

    } catch (error) {
        // SICHERHEITSNETZ: Verhindert, dass dein kompletter Node-Server abstürzt!
        console.error('[Core Fehler abgefangen]:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Streaming momentan nicht möglich.');
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 ===================================================`);
    console.log(`   ELYSIUM MUSIC ENGINE // CORE SUCCESSFULLY STARTED`);
    console.log(`   -> API Endpoint: http://127.0.0.1:${PORT}`);
    console.log(`   ===================================================`);
});