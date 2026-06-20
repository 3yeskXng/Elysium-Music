import { state, updateDOM } from './state.js';
import { fetchFromCore } from './api.js';

// Event-Listeners absolut sicher binden
document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('playPauseBtn');
    const skipBtn = document.getElementById('btn-skip');
    const loadBtn = document.getElementById('btn-load-song');

    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (skipBtn) skipBtn.addEventListener('click', () => fetchFromCore('/skip', 'POST'));
    if (loadBtn) loadBtn.addEventListener('click', loadRequestedSong);
});

// Funktion um Wunsch-Song an den Core zu senden
async function loadRequestedSong() {
    const inputField = document.getElementById('songInput');
    if (!inputField) return;
    
    const songName = inputField.value.trim();
    if (!songName) return;
    
    console.log("Sende Musik-Wunsch an Core:", songName);
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
    }
}

// Kontinuierlicher Sync-Ticker mit dem Node-Core (Jede Sekunde)
setInterval(async () => {
    const data = await fetchFromCore('/status');
    
    // HTML Elemente holen
    const trackTitleEl = document.getElementById('trackTitle');
    const statusBadgeEl = document.getElementById('engineStatus');
    const progressBarEl = document.getElementById('progressBar');
    const timeCurrentEl = document.getElementById('timeCurrent');
    const timeTotalEl = document.getElementById('timeTotal');
    const playPauseBtnEl = document.getElementById('playPauseBtn');

    if (data) {
        // Zustand in den globalen State schreiben
        state.currentTrack = data.currentTrack || "Kein Track geladen";
        state.duration = data.duration || 0;
        state.currentSeconds = data.currentSeconds || 0;
        state.status = data.isPaused ? 'paused' : 'playing';

        // Direktes Schreiben ins HTML
        if (trackTitleEl) trackTitleEl.innerText = state.currentTrack;
        
        if (statusBadgeEl) {
            statusBadgeEl.innerText = data.isPaused ? 'PAUSIERT' : 'SPIELT';
            statusBadgeEl.className = `badge ${data.isPaused ? 'paused' : 'playing'}`;
        }

        if (playPauseBtnEl) {
            playPauseBtnEl.innerText = data.isPaused ? 'PLAY' : 'PAUSE';
        }

        // Fortschrittsbalken berechnen
        if (progressBarEl && state.duration > 0) {
            const percent = (state.currentSeconds / state.duration) * 100;
            progressBarEl.style.width = `${percent}%`;
        }
        
        if (timeCurrentEl) timeCurrentEl.innerText = formatTime(state.currentSeconds);
        if (timeTotalEl) timeTotalEl.innerText = formatTime(state.duration);
    } else {
        // Wenn das Backend nicht erreichbar ist
        if (trackTitleEl) trackTitleEl.innerText = "Core Offline 🤖";
        if (statusBadgeEl) {
            statusBadgeEl.innerText = "OFFLINE";
            statusBadgeEl.className = "badge standby";
        }
    }
}, 1000);

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}