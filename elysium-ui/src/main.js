import { state, updateDOM } from './state.js';
import { fetchFromCore } from './api.js';

// Unser unsichtbarer Audio-Player für die Musik (bereit für Opus-Streams!)
const audioEngine = new Audio();

document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('playPauseBtn');
    const skipBtn = document.getElementById('btn-skip');
    const loadBtn = document.getElementById('btn-load-song');

    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (skipBtn) skipBtn.addEventListener('click', handleSkip);
    if (loadBtn) loadBtn.addEventListener('click', loadRequestedSong);
    
    // Hardware-Medientasten deiner Tastatur registrieren!
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('nexttrack', handleSkip);
    }
});

async function loadRequestedSong() {
    const inputField = document.getElementById('songInput');
    if (!inputField) return;
    
    const songName = inputField.value.trim();
    if (!songName) return;
    
    console.log("Sende Musik-Wunsch an Core:", songName);
    const data = await fetchFromCore('/play-track', 'POST', { track: songName });
    
    if (data) {
        inputField.value = '';
        
        // TEST-SOUND: Da dein Backend noch keine echten Opus-Dateien streamt,
        // füttern wir die Audio-Engine mit einem kurzen Sound, damit Windows die Medientasten freischaltet!
        audioEngine.src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 
        audioEngine.play();
        
        // Windows-Systemsteuerung updaten (wird im Windows-Overlay angezeigt!)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: data.currentTrack,
                artist: 'Elysium Music Engine',
                album: 'Core Stream'
            });
        }
    }
}

async function togglePlay() {
    const data = await fetchFromCore('/pause', 'POST');
    if (data) {
        state.isPlaying = !data.isPaused;
        state.status = data.isPaused ? 'paused' : 'playing';
        
        // Audio-Engine synchronisieren
        if (data.isPaused) {
            audioEngine.pause();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
        } else {
            audioEngine.play();
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
        }
    }
}

async function handleSkip() {
    await fetchFromCore('/skip', 'POST');
    // Hier später: Nächsten Opus-Track in audioEngine laden
}

// Kontinuierlicher Sync-Ticker mit dem Node-Core
setInterval(async () => {
    const data = await fetchFromCore('/status');
    
    const trackTitleEl = document.getElementById('trackTitle');
    const statusBadgeEl = document.getElementById('engineStatus');
    const progressBarEl = document.getElementById('progressBar');
    const timeCurrentEl = document.getElementById('timeCurrent');
    const timeTotalEl = document.getElementById('timeTotal');
    const playPauseBtnEl = document.getElementById('playPauseBtn');

    if (data) {
        state.currentTrack = data.currentTrack || "Kein Track geladen";
        state.duration = data.duration || 0;
        state.currentSeconds = data.currentSeconds || 0;

        if (trackTitleEl) trackTitleEl.innerText = state.currentTrack;
        
        if (statusBadgeEl) {
            statusBadgeEl.innerText = data.isPaused ? 'PAUSIERT' : 'SPIELT';
            statusBadgeEl.className = `badge ${data.isPaused ? 'paused' : 'playing'}`;
        }

        if (playPauseBtnEl) playPauseBtnEl.innerText = data.isPaused ? 'PLAY' : 'PAUSE';

        if (progressBarEl && state.duration > 0) {
            const percent = (state.currentSeconds / state.duration) * 100;
            progressBarEl.style.width = `${percent}%`;
        }
        
        if (timeCurrentEl) timeCurrentEl.innerText = formatTime(state.currentSeconds);
        if (timeTotalEl) timeTotalEl.innerText = formatTime(state.duration);
    } else {
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