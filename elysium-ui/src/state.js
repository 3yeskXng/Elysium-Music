import { t } from './i18n.js';

export const state = {
    isPlaying: false,
    currentTrack: t('noTrack'),
    duration: 0,
    currentSeconds: 0,
    status: 'standby' // standby, playing, paused, offline
};

// Aktualisiert die UI-Elemente basierend auf dem aktuellen Zustand
export function updateDOM() {
    document.getElementById('brand-text').innerText = t('brand');
    document.getElementById('trackTitle').innerText = state.currentTrack;
    
    const statusBadge = document.getElementById('engineStatus');
    statusBadge.innerText = t(state.status);
    statusBadge.className = `badge ${state.status}`;

    document.getElementById('playPauseBtn').innerText = state.isPlaying ? t('paused') : "PLAY";
    document.getElementById('btn-skip').innerText = t('btnSkip');
    document.getElementById('btn-settings').innerText = t('btnSettings');
}