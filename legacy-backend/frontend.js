const BACKEND_URL = 'http://localhost:3000/api';

// Toggelt zwischen Play und Pause via Node-API
async function togglePlayPause() {
    try {
        const res = await fetch(`${BACKEND_URL}/pause`, { method: 'POST' });
        const data = await res.json();
        updatePlayButton(data.isPaused);
    } catch (err) {
        console.error("Core nicht erreichbar", err);
    }
}

// Generische Funktion für Skip, Stop etc.
async function sendControl(action) {
    try {
        await fetch(`${BACKEND_URL}/${action}`, { method: 'POST' });
    } catch (err) {
        console.error(`Fehler bei Aktion ${action}`, err);
    }
}

function updatePlayButton(isPaused) {
    const btn = document.getElementById('playPauseBtn');
    if (isPaused) {
        btn.innerText = "RESUME";
        document.getElementById('engineStatus').innerText = "PAUSED";
    } else {
        btn.innerText = "PAUSE";
        document.getElementById('engineStatus').innerText = "PLAYING";
    }
}

// Live-Ticker: Holt den Zustand synchron aus dem Node-Core
setInterval(async () => {
    try {
        const res = await fetch(`${BACKEND_URL}/status`);
        const data = await res.json();

        if (data) {
            // Fortschrittsbalken berechnen
            if (data.duration > 0) {
                const percent = (data.currentSeconds / data.duration) * 100;
                document.getElementById('progressBar').style.width = percent + '%';
            }
            
            // Zeiten formatieren (z.B. 90 Sekunden -> 01:30)
            document.getElementById('timeCurrent').innerText = formatTime(data.currentSeconds);
            document.getElementById('timeTotal').innerText = formatTime(data.duration);
            
            if (data.currentTrack) {
                document.getElementById('trackTitle').innerText = data.currentTrack;
            }
        }
    } catch (e) {
        document.getElementById('engineStatus').innerText = "OFFLINE";
    }
}, 1000);

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}