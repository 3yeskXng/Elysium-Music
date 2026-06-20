import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 🔌 INTEGRATION DER NEUEN PLUGIN-ARCHITEKTUR
import { LocalProvider } from './plugins/localProvider.js';
import { YoutubeProvider } from './plugins/youtubeProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000; 

app.use(cors());
app.use(express.json());

// 📋 DIE ANBIETER-KETTE (Hier oben global definiert – extrem leicht erweiterbar!)
const providers = [LocalProvider, YoutubeProvider];

// ==========================================
// 🚨 BULLETPROOF DIAGNOSE-LOGGING
// ==========================================
const logFilePath = path.join(__dirname, 'elysium_debug.log');
if (fs.existsSync(logFilePath)) {
    try { fs.unlinkSync(logFilePath); } catch (e) {}
}

function writeToLogFile(section, title, data) {
    const timestamp = new Date().toLocaleString('de-DE');
    let output = `\n[${timestamp}] [${section}] === ${title} ===\n`;
    if (data instanceof Error) {
        output += `❌ NACHRICHT: ${data.message}\n📋 STACK-TRACE:\n${data.stack}\n`;
    } else if (typeof data === 'object') {
        output += `📦 DATEN-DUMP:\n${JSON.stringify(data, null, 2)}\n`;
    } else {
        output += `📝 INFO: ${data}\n`;
    }
    output += `========================================================================\n`;
    try { fs.appendFileSync(logFilePath, output, 'utf8'); } catch (e) {}
}

// System-Sicherheitsnetze
process.on('uncaughtException', (err) => writeToLogFile('GLOBAL_CRITICAL', 'Ausnahmefehler', err));
process.on('unhandledRejection', (reason) => writeToLogFile('GLOBAL_REJECTION', 'Asynchroner Abbruch', reason));

let playerState = { currentTrack: "Kein Track geladen", duration: 0, currentSeconds: 0, isPaused: true };
setInterval(() => { if (!playerState.isPaused && playerState.currentSeconds < playerState.duration) playerState.currentSeconds++; }, 1000);

app.get('/api/status', (req, res) => res.json(playerState));
app.post('/api/play-track', (req, res) => {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Kein Track angegeben' });
    playerState.currentTrack = track; playerState.currentSeconds = 0; playerState.duration = 180; playerState.isPaused = false;
    console.log(`[Core] UI fordert Song an: "${track}"`);
    res.json(playerState);
});
app.post('/api/pause', (req, res) => { playerState.isPaused = !playerState.isPaused; res.json(playerState); });
app.post('/api/skip', (req, res) => { playerState.currentTrack = "Kein Track geladen"; playerState.currentSeconds = 0; playerState.duration = 0; playerState.isPaused = true; res.json(playerState); });

/**
 * 🎵 ULTRA-MODULARER STREAMING ROUTER
 */
app.get('/api/audio', async (req, res) => {
    const trackName = req.query.track;
    if (!trackName) return res.status(400).send('Kein Track angegeben.');

    // Wir wandern durch alle registrierten Provider
    for (const provider of providers) {
        try {
            writeToLogFile('ROUTER', `Frage Musik-Provider ab: ${provider.name}`, `Suche nach: ${trackName}`);
            
            // Fall 1: Lokaler Musik-Provider
            if (provider.name === 'Lokale Festplatte') {
                const result = await provider.getStream(trackName, __dirname);
                if (result) {
                    console.log(`[Core] 💾 Spiele lokale Datei via [${provider.name}]: ${trackName}`);
                    writeToLogFile('ROUTER_SUCCESS', 'Erfolgreich lokale Datei geladen', result.filePath);
                    return res.sendFile(result.filePath);
                }
            }

            // Fall 2: Online-Streaming-Provider (YouTube oder zukünftige Plugins)
            if (provider.name === 'YouTube Streaming') {
                console.log(`[Core] 🔍 "${trackName}" nicht lokal. Rufe Plugin auf [${provider.name}]...`);
                const result = await provider.getStream(trackName, writeToLogFile);
                
                if (result && result.stream) {
                    console.log(`[Core] 🌐 Stream steht für: "${result.title}"`);
                    
                    playerState.currentTrack = result.title;
                    playerState.duration = result.duration;

                    res.setHeader('Content-Type', result.contentType);
                    
                    result.stream.on('error', (streamErr) => {
                        writeToLogFile('STREAM_PIPE_ERROR', 'Live-Stream während Übertragung abgebrochen', streamErr);
                    });

                    result.stream.pipe(res);
                    writeToLogFile('ROUTER_SUCCESS', `Streaming via ${provider.name} läuft absolut sauber!`, result.title);
                    return; // Stream erfolgreich injiziert, beende die Routen-Schleife!
                }
            }

        } catch (providerError) {
            console.error(`[Core Fehler bei Provider ${provider.name}]:`, providerError.message);
            writeToLogFile('ROUTER_PROVIDER_ERROR', `Fehler im Plugin ${provider.name}`, providerError);
            // Ein Fehler in einem Plugin lässt die Schleife weiterlaufen. Das nächste Plugin fängt es ab!
        }
    }

    // Wenn kein einziger Provider geliefert hat
    if (!res.headersSent) {
        res.status(404).send('Audio-Quelle konnte von keinem Plugin bereitgestellt werden.');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 ===================================================`);
    console.log(`   ELYSIUM MUSIC ENGINE // CORE SUCCESSFULLY STARTED`);
    console.log(`   -> API Endpoint: http://127.0.0.1:${PORT}`);
    console.log(`   ===================================================`);
    console.log(`   🔌 PLUGIN ARCHITEKTUR GELADEN. Aktive Provider: ${providers.length}`);
    providers.forEach(p => console.log(`      -> [Aktiv] ${p.name}`));
});