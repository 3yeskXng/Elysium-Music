// elysium-ui/src/modules/listenModule.js
// Music library browser and playback controller

import { invokeBackend } from '../api.js';
import { audioEngine } from '../core/audioEngine.js';
import { translations } from '../config/translations.js';
import { showLoader, hideLoader } from '../core/loader.js';
import { resolveArtist } from '../utils/resolveArtist.js';

const ICON_HEADPHONES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`;

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Listen', msg);
}

export const listenModule = {
    id: 'listen',
    label: 'Hören',
    icon: ICON_HEADPHONES,
    tracks: [],
    currentTrackIndex: -1,
    viewportElement: null,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        this.viewportElement = vp;

        vp.innerHTML = `
            <h2 class="view-title" data-i18n="lib_title">Deine Musikbibliothek</h2>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;" data-i18n="lib_sub">High-Fidelity Audio-Übersicht mit lokalen und heruntergeladenen Titeln.</p>
            <div id="library-tracks-container" style="display:flex; flex-direction:column; gap:8px; margin-bottom:90px;">
                <span style="color:var(--accent-premium);" data-i18n="lib_loading">Lese lokalen Musik-Pool aus...</span>
            </div>
        `;

        this.loadLocalTracks(vp);
        this.initSkipEngine();
        this.initRefreshListener();
        return vp;
    },

    async loadLocalTracks(vp) {
        const box = vp.querySelector('#library-tracks-container');
        if (!box) return;

        const lang = localStorage.getItem('elysium_language') || 'de';
        const t = translations[lang] || translations.de;
        showLoader(box, t.lib_loading || 'Loading...');

        try {
            this.tracks = await invokeBackend('scan_local_library');

            if (this.tracks.length === 0) {
                box.innerHTML = `<div style="color:var(--text-muted); padding:20px; border:1px dashed var(--border-subtle); border-radius:8px; text-align:center; user-select:text;" data-i18n="lib_empty">
                    ${lang === 'de' ? 'Keine Audiodateien im Ordner "music/" gefunden.' : 'No audio files found in the "music/" folder.'}
                </div>`;
                log('INFO', 'Library scan complete: 0 tracks found');
                return;
            }

            hideLoader(box);
            box.innerHTML = '';
            this.tracks.forEach((t, i) => this.appendTrackRow(box, t, i));

            if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.tracks.length) {
                this.highlightRow(this.currentTrackIndex);
            }
            log('SUCCESS', `Library loaded: ${this.tracks.length} track(s) — [${this.tracks.map(t => t.title).join(', ')}]`);
        } catch (err) {
            hideLoader(box);
            box.innerHTML = `<span style="color:#ef4444; user-select:text;">Fehler: ${err.message || err}</span>`;
            log('ERROR', `Library scan failed: ${err.message || err}`);
        }
    },

    appendTrackRow(box, track, index) {
        const row = document.createElement('div');
        row.className = 'track-row-item';
        row.dataset.trackIndex = index;
        row.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-left:3px solid transparent; border-radius:6px; cursor:pointer; transition:all 0.2s ease;`;
        row.innerHTML = `<div><div style="font-weight:600; font-size:0.95rem; color:var(--text-main);">${track.title}</div><div style="font-size:0.8rem; color:var(--text-muted);">${resolveArtist(track.artist)}</div></div><div style="font-size:0.9rem; color:var(--text-muted); font-family:monospace;">${track.duration || '--:--'}</div>`;
        row.addEventListener('click', () => this.playTrackAt(index));
        box.appendChild(row);
    },

    playTrackAt(index) {
        if (index < 0 || index >= this.tracks.length) return;
        this.currentTrackIndex = index;
        const track = this.tracks[index];
        this.highlightRow(index);
        audioEngine.playTrack(track);
        log('INFO', `Playback started: "${track.title}" by ${track.artist || 'Unknown'} — Duration: ${track.duration || 'N/A'} — Path: ${track.file_path}`);
    },

    highlightRow(index) {
        if (!this.viewportElement) return;
        this.viewportElement.querySelectorAll('.track-row-item').forEach(r => {
            r.style.borderLeftColor = 'transparent';
            r.style.background = 'var(--bg-sidebar)';
        });
        const active = this.viewportElement.querySelector(`.track-row-item[data-track-index="${index}"]`);
        if (active) {
            active.style.borderLeftColor = 'var(--accent-premium)';
            active.style.background = 'rgba(138, 92, 246, 0.05)';
        }
    },

    initRefreshListener() {
        window.removeEventListener('elysium-library-refresh', this._refreshHandler);
        this._refreshHandler = () => {
            if (this.viewportElement) this.loadLocalTracks(this.viewportElement);
        };
        window.addEventListener('elysium-library-refresh', this._refreshHandler);
    },

    initSkipEngine() {
        window.removeEventListener('elysium-skip-next', this._skipHandler);
        this._skipHandler = () => {
            if (this.tracks.length === 0) return;
            this.playTrackAt((this.currentTrackIndex + 1) % this.tracks.length);
        };
        window.addEventListener('elysium-skip-next', this._skipHandler);
    }
};
