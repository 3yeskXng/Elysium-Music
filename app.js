import express from 'express';
import cors from 'cors';

// ==========================================
// ARCHITEKTUR-HINWEIS FÜR DIE ZUKUNFT:
// Hier werden später deine echten Module geladen, z.B.:
// import { corePlayer } from './modules/player.js';
// import { pluginManager } from './modules/plugins.js';
// ==========================================

const app = express();
const PORT = 3000;

// CORS aktivieren, damit die Tauri-Desktop-Hülle sichere Anfragen senden darf
app.use(cors());
app.use(express.json());

// Das globale "Gehirn" des Cores (Zustands-Management)
// Bereit für moderne Audio-Formate wie Opus
let playerState = {
    currentTrack: "Elysium Overture (Opus-Stream).opus", 
    duration: 240,            // Gesamtlänge in Sekunden (4 Minuten)
    currentSeconds: 0,        // Aktuelle Abspielposition
    isPaused: true            // Standardmäßig im Standby
};

// Modularer Ticker: Simuliert das Abspielen im Hintergrund
setInterval(() => {
    if (!playerState.isPaused && playerState.currentSeconds < playerState.duration) {
        playerState.currentSeconds++;
    }
}, 1000);

// ==========================================
// REST-API ENDPOINTS (Schnittstelle zur UI)
// ==========================================

/**
 * 1. STATUS-SYNC
 * Die UI fragt diesen Endpoint jede Sekunde ab, um synchron zu bleiben.
 */
app.get('/api/status', (req, res) => {
    res.json(playerState);
});

/**
 * 2. WIEDERGABE / PAUSE
 * Steuert den aktuellen Abspielmodus.
 */
app.post('/api/pause', (req, res) => {
    playerState.isPaused = !playerState.isPaused;
    
    // Log für die Konsole, damit du siehst, dass die UI gefunkt hat
    console.log(`[Core] Status geändert: ${playerState.isPaused ? '⏸ PAUSE' : '▶ WIEDERGABE'}`);
    res.json(playerState);
});

/**
 * 3. TRACK ÜBERSPRINGEN (SKIP)
 * Hier klinkt sich später die modulare Queue ein, um den nächsten Song zu laden.
 */
app.post('/api/skip', (req, res) => {
    console.log("[Core] ⏭ Skip-Signal empfangen. Rufe Plugin-Schnittstelle auf...");
    
    // Mock-Daten für den nächsten Song
    playerState.currentSeconds = 0;
    playerState.currentTrack = "Modular-Plugin-Track.opus";
    playerState.duration = 180;
    playerState.isPaused = false; // Direkt weiterspielen
    
    res.json(playerState);
});


/**
 * 4. WUNSCH-SONG LADEN (Aus dem UI Eingabefeld)
 * Hier kommt später die Nuclear-Logik rein (z.B. YouTube-Suche starten)
 */
app.post('/api/play-track', (req, res) => {
    const { track } = req.body;
    console.log(`[Core] UI fordert Song an: "${track}"`);
    
    // Wir simulieren, dass das System den Song sofort lädt
    playerState.currentTrack = track; 
    playerState.duration = 180;        // Standardmäßig 3 Minuten
    playerState.currentSeconds = 0;    // Song startet von vorn
    playerState.isPaused = false;      // Direkt abspielen!
    
    res.json(playerState);
});
// Server starten
// Ändere die Zeile so ab:
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🤖 ===================================================`);
    console.log(`   ELYSIUM MUSIC ENGINE // CORE SUCCESSFULLY STARTED`);
    console.log(`   -> API Endpoint: http://127.0.0.1:${PORT}`);
    console.log(`   -> Status: Waiting for Tauri UI connection...`);
    console.log(`   ===================================================\n`);
});