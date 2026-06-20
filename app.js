import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import play from 'play-dl'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; 

app.use(cors());
app.use(express.json());

// ==========================================
// 🚨 RADIKALES DEEP-LOGGING TOOL (FORCED WRITE)
// ==========================================
const logFilePath = path.join(__dirname, 'elysium_debug.log');

// Löscht ein altes Log beim Serverstart, damit wir nur frische Daten sehen
if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
}

function writeToLogFile(section, title, data) {
    const timestamp = new Date().toLocaleString('de-DE');
    let output = `\n[${timestamp}] [${section}] === ${title} ===\n`;
    
    if (data instanceof Error) {
        output += `❌ NACHRICHT: ${data.message}\n`;
        output += `📋 STACK-TRACE:\n${data.stack}\n`;
    } else if (typeof data === 'object') {
        output += `📦 DATEN-DUMP:\n${JSON.stringify(data, null, 2)}\n`;
    } else {
        output += `📝 INFO: ${data}\n`;
    }
    output += `========================================================================\n`;
    
    fs.appendFileSync(logFilePath, output, 'utf8');
}

// Globale Sicherheitsnetze für versteckte Node-Fehler
process.on('uncaughtException', (err) => {
    writeToLogFile('GLOBAL_CRITICAL_EXCEPTION', 'Unbehandelter Ausnahmefehler im Hauptprozess', err);
    console.error('💥 KRITISCHER FEHLER IM LOG GESPEICHERT!');
});

process.on('unhandledRejection', (reason) => {
    writeToLogFile('GLOBAL_CRITICAL_REJECTION', 'Unbehandelter Promise-Abbruch', reason);
    console.error('💥 ASYNCHRONER ABBRUCH IM LOG GESPEICHERT!');
});

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
 * 5. HYBRID-AUDIO-STREAMING (Mit Diagnose-Modus & Auto-Sanitization)
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

    try {
        console.log(`[Core] "${trackName}" nicht lokal. Suche auf YouTube...`);
        writeToLogFile('YT_STAGE_1', 'Suche gestartet', `Suchbegriff: ${trackName}`);
        
        const searchResults = await play.search(trackName, { limit: 1 });
        const video = searchResults[0];
        
        if (!video) {
            console.log(`[Core] Nichts auf YouTube gefunden.`);
            writeToLogFile('YT_STAGE_1_FAIL', 'Suche ergab keine Treffer', { trackName });
            return res.status(404).send('Song nirgends gefunden.');
        }

        console.log(`[Core] Versuche Stream aufzubauen für: "${video.title}"`);
        
        writeToLogFile('YT_STAGE_2', 'Video-Objekt analysieren', {
            gefundenes_video_titel: video.title,
            generierte_url: video.url,
            video_id: video.id,
            objekt_typ: video.type
        });

        playerState.currentTrack = video.title;
        playerState.duration = video.durationInSec || 180;

        // Schritt A: Video-Informationen holen
        writeToLogFile('YT_STAGE_3', 'Starte play.video_info()', `Nutze URL: ${video.url}`);
        const videoInfo = await play.video_info(video.url);
        
        writeToLogFile('YT_STAGE_4', 'play.video_info() erfolgreich abgeschlossen', {
            anzahl_formate: videoInfo?.format?.length || 0,
            ist_live: videoInfo?.video_details?.isLiveContent
        });

        // 🔥 GENIALER INTERCEPT-FILTER: KAPUTTE YOUTUBE-FORMAT-URLS REINIGEN 🔥
        // Wir sieben fehlerhafte Platzhalter aus, BEVOR play-dl intern darüber stolpert!
        if (videoInfo && Array.isArray(videoInfo.format)) {
            const alteAnzahl = videoInfo.format.length;
            videoInfo.format = videoInfo.format.filter(f => {
                if (!f || !f.url) return false;
                try {
                    new URL(f.url); // Testen, ob die URL im Node-Standard-Parser gültig ist
                    return true;
                } catch (e) {
                    return false; // Fliegt raus, wenn ungültig!
                }
            });
            writeToLogFile('YT_SANITIZATION', `Umgangene URL-Sperre! Formate von ${alteAnzahl} auf ${videoInfo.format.length} bereinigt.`, {
                gefilterte_formate: alteAnzahl - videoInfo.format.length
            });
            
            if (videoInfo.format.length === 0) {
                throw new Error("YouTube hat für dieses Video ausschließlich ungültige Streaming-Formate geliefert.");
            }
        }

        // Schritt B: Stream-Extraktion aus den bereinigten Formaten
        writeToLogFile('YT_STAGE_5', 'Starte play.stream_from_info()', 'Fordere Audio-Stream an');
        const youtubeStream = await play.stream_from_info(videoInfo, {
            quality: 2, 
            htmlAgent: play.userAgent 
        });

        if (!youtubeStream || !youtubeStream.stream) {
            throw new Error("Kritisch: youtubeStream oder Unter-Stream ist undefiniert!");
        }

        res.setHeader('Content-Type', youtubeStream.type || 'audio/webm');
        
        youtubeStream.stream.on('error', (streamErr) => {
            console.error('[Stream-Pipe Fehler]:', streamErr.message);
            writeToLogFile('PIPE_ERROR', 'Fehler während der laufenden Übertragung', streamErr);
        });

        youtubeStream.stream.pipe(res);
        writeToLogFile('YT_STAGE_SUCCESS', 'Stream erfolgreich an UI durchgeleitet', video.title);

    } catch (error) {
        console.error('[Core Fehler abgefangen]:', error.message);
        writeToLogFile('ENDPOINT_CATCH', 'Fehler im try-catch-Block abgefangen', error);
        
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
    console.log(`   📝 DIAGNOSEMODUS AKTIV: Fehler werden in 'elysium_debug.log' geschrieben.`);
});