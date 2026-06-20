import { state, updateDOM } from './state.js';
import { fetchFromCore } from './api.js';
import { t } from './i18n.js';

// Event-Listeners für die Buttons binden
document.getElementById('playPauseBtn').addEventListener('click', togglePlay);
document.getElementById('btn-skip').addEventListener('click', () => fetchFromCore('/skip', 'POST'));

async function togglePlay() {
    const data = await fetchFromCore('/pause', 'POST');
    if (data) {
        state.isPlaying = !data.isPaused;
        state.status = data.isPaused ? 'paused' : 'playing';
        updateDOM();
    }
}

// Kontinuierlicher Sync-Ticker mit dem Node-Core
setInterval(async () => {
    const data = await fetchFromCore('/status');
    
    if (data) {
        state.currentTrack = data.currentTrack || t('noTrack');
        state.duration = data.duration || 0;
        state.currentSeconds = data.currentSeconds || 0;
        state.status = data.isPaused ? 'paused' : (data.currentTrack ? 'playing' : 'standby');
        state.isPlaying = !data.isPaused && !!data.currentTrack;

        // Fortschrittsbalken berechnen
        if (state.duration > 0) {
            const percent = (state.currentSeconds / state.duration) * 100;
            document.getElementById('progressBar').style.width = `${percent}%`;
        }
        
        document.getElementById('timeCurrent').innerText = formatTime(state.currentSeconds);
        document.getElementById('timeTotal').innerText = formatTime(state.duration);
    } else {
        state.status = 'offline';
        state.currentTrack = t('noTrack');
    }
    
    updateDOM();
}, 1000);

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Initialer Aufruf beim Starten der App
updateDOM();