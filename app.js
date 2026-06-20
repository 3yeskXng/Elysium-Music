const readline = require('readline');
const express = require('express');
const path = require('path');

// Autodetect: Lädt dein Core- oder Player-Modul, egal wie es benannt ist
let core;
try {
    core = require('./core');
} catch (e) {
    try {
        core = require('./modules/player');
    } catch (err) {
        console.error("❌ Kritischer Fehler: Weder './core.js' noch './modules/player.js' gefunden!");
        process.exit(1);
    }
}

const app = express();
const API_PORT = 3000;

app.use(express.json());
// Erlaubt optional das Laden statischer Web-Dateien aus dem "public" Ordner
app.use(express.static(path.join(__dirname, 'public')));

// =========================================================================
// 1. THE BRIDGE: HTTP REST API (Für Tauri, Kotlin & Web-UIs)
// =========================================================================

// UI fragt den aktuellen Live-Status ab
app.get('/api/status', (req, res) => {
    res.json({
        isPlaying: !!(core.audioProcess || core.isPlaying || core.playing),
        isPaused: !!core.isPaused,
        currentSeconds: core.currentSeconds || 0,
        duration: core.duration || 0,
        currentTrack: core.currentTrack || null
    });
});

// UI fügt einen Song hinzu oder spielt ihn ab
app.post('/api/play', (req, res) => {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Kein Track angegeben' });

    try {
        if (typeof core.enqueue === 'function') {
            core.enqueue(track);
        } else if (typeof core.play === 'function') {
            core.play(track);
        }
        res.json({ success: true, message: `Track geladen: ${track}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UI schaltet Pause/Fortsetzen um
app.post('/api/pause', (req, res) => {
    try {
        if (typeof core.togglePause === 'function') {
            core.togglePause();
        } else if (typeof core.pause === 'function' && core.isPaused) {
            if (typeof core.resume === 'function') core.resume();
        } else if (typeof core.pause === 'function') {
            core.pause();
        }
        res.json({ success: true, isPaused: !!core.isPaused });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UI überspringt den aktuellen Song
app.post('/api/skip', (req, res) => {
    try {
        if (typeof core.skip === 'function') {
            core.skip();
        } else if (typeof core.stop === 'function') {
            core.stop();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API-Server im Hintergrund starten
app.listen(API_PORT, () => {
    console.log(`\n🌐 [Elysium Link] API aktiv auf http://localhost:${API_PORT} (Bereit für Tauri/Kotlin)`);
});


// =========================================================================
// 2. THE COMMAND LINE: Vollständige CLI-Steuerung im Terminal
// =========================================================================
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function handleCliCommand(line) {
    const args = line.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const param = args.slice(1).join(' ');

    switch (cmd) {
        case 'play':
            if (!param) {
                console.log('❌ Fehler: Bitte gib einen Dateipfad an! (z.B. play song.opus)');
            } else {
                try {
                    if (typeof core.enqueue === 'function') core.enqueue(param);
                    else if (typeof core.play === 'function') core.play(param);
                    console.log(`🎵 Spiele: ${param}`);
                } catch (e) {
                    console.log(`❌ Fehler beim Abspielen: ${e.message}`);
                }
            }
            break;

        case 'pause':
            try {
                if (typeof core.togglePause === 'function') core.togglePause();
                console.log(core.isPaused ? '⏸️  Wiedergabe pausiert' : '▶️  Wiedergabe fortgesetzt');
            } catch (e) {
                console.log(`❌ Fehler bei Pause: ${e.message}`);
            }
            break;

        case 'skip':
        case 'stop':
            try {
                if (typeof core.skip === 'function') core.skip();
                else if (typeof core.stop === 'function') core.stop();
                console.log('⏭️  Track geändert/gestoppt.');
            } catch (e) {
                console.log(`❌ Fehler bei Skip: ${e.message}`);
            }
            break;

        case 'exit':
            console.log('👋 Schließe Elysium Audio Engine...');
            if (typeof core.stop === 'function') core.stop();
            process.exit(0);
            break;

        case '':
            break;

        default:
            console.log(`❌ Unbekannter Befehl: "${cmd}". Erlaubt: play, pause, skip, exit`);
            break;
    }
    rl.prompt();
}

// CLI-Interface initialisieren
console.log(`⌨️  [Elysium CLI] Aktiv. Befehle: play <pfad>, pause, skip, exit`);
rl.setPrompt('ELYSIUM> ');
rl.prompt();

rl.on('line', (line) => {
    handleCliCommand(line);
});