import { state, updateDOM } from './state.js';
import { fetchFromCore } from './api.js';
import { t } from './i18n.js';

// Event-Listeners binden
document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.getElementById('btn-skip').addEventListener('click', () => fetchFromCore('/skip', 'POST'));
document.getElementById('btn-load-song').addEventListener('click', loadRequestedSong);

// Funktion um Wunsch-Song an den Core zu senden
async function loadRequestedSong() {
    const inputField = document.getElementById('songInput');
    const songName = inputField.value.trim();
    
    if (!songName) return;
    
    console.log("Sende Musik-Wunsch an Core:", songName);
    // Wir funken den neuen Endpoint an, den wir gleich im Backend bauen
    const data = await fetchFromCore('/play-track', 'POST', { track: songName });
    
    if (data) {
        inputField.value = ''; // Eingabefeld leeren
    }
}

async function togglePlay() {
    const data = await fetchFromCore('/pause', 'POST');
    if (data) {
        state.isPlaying = !data.isPaused;
        state.status = data.isPaused ? 'paused' : 'playing';
        updateDOM();
    }
}

// Kontinuierlicher Sync-Ticker mit dem Node-Core (Jede Sekunde)
setInterval(async () => {
    const data = await fetchFromCore('/status');
    
    if (data) {
        // Zustand in den globalen State schreiben
        state.currentTrack = data.currentTrack || "Kein Track";
        state.duration = data.duration || 0;
        state.currentSeconds = data.currentSeconds || 0;
        state.status = data.isPaused ? 'paused' : 'playing';

        // Sicherheits-Fix: Direktes Schreiben ins HTML, damit die Striche verschwinden!
        document.getElementById('trackTitle').innerText = state.currentTrack;
        
        const statusBadge = document.getElementById('engineStatus');
        statusBadge.innerText = data.isPaused ? 'PAUSIERT' : 'SPIELT';
        statusBadge.className = `badge ${data.isPaused ? 'paused' : 'playing'}`;

        // Fortschrittsbalken berechnen
        if (state.duration > 0) {
            const percent = (state.currentSeconds / state.duration) * 100;
            document.getElementById('progressBar').style.width = `${percent}%`;
        }
        
        document.getElementById('timeCurrent').innerText = formatTime(state.currentSeconds);
        document.getElementById('timeTotal').innerText = formatTime(state.duration);
    } else {
        // Wenn das Backend nicht erreichbar ist
        document.getElementById('trackTitle').innerText = "Core Offline 🤖";
        document.getElementById('engineStatus').innerText = "OFFLINE";
        document.getElementById('engineStatus').className = "badge standby";
    }
    
    if (typeof updateDOM === 'function') updateDOM();
}, 1000);

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

if (typeof updateDOM === 'function') updateDOM();