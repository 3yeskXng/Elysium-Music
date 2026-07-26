// elysium-ui/src/modules/listen/services/libraryService.js
// Library scan, track rendering, playback, and event management

import { invokeBackend } from '../../../api.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { translations } from '../../../config/translations.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { resolveArtist } from '../../../utils/resolveArtist.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Listen', msg);
}

export async function loadLocalTracks(module) {
    const vp = module.viewportElement;
    if (!vp) return;
    const box = vp.querySelector('#library-tracks-container');
    if (!box) return;

    const lang = localStorage.getItem('elysium_language') || 'de';
    const t = translations[lang] || translations.de;
    showLoader(box, t.lib_loading || 'Loading...');

    try {
        module.tracks = await invokeBackend('scan_local_library');

        if (module.tracks.length === 0) {
            hideLoader(box);
            box.innerHTML = `<div style="color:var(--text-muted); padding:20px; border:1px dashed var(--border-subtle); border-radius:8px; text-align:center; user-select:text;" data-i18n="lib_empty">
                ${lang === 'de' ? 'Keine Audiodateien im Ordner "music/" gefunden.' : 'No audio files found in the "music/" folder.'}
            </div>`;
            log('INFO', 'Library scan complete: 0 tracks found');
            return;
        }

        hideLoader(box);
        box.innerHTML = '';
        module.tracks.forEach((t, i) => appendTrackRow(box, t, i));

        if (module.currentTrackIndex >= 0 && module.currentTrackIndex < module.tracks.length) {
            highlightRow(module, module.currentTrackIndex);
        }
        log('SUCCESS', `Library loaded: ${module.tracks.length} track(s) — [${module.tracks.map(t => t.title).join(', ')}]`);
    } catch (err) {
        hideLoader(box);
        box.innerHTML = `<span style="color:#ef4444; user-select:text;">Fehler: ${err.message || err}</span>`;
        log('ERROR', `Library scan failed: ${err.message || err}`);
    }
}

function appendTrackRow(box, track, index) {
    const row = document.createElement('div');
    row.className = 'track-row-item';
    row.dataset.trackIndex = index;
    row.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-left:3px solid transparent; border-radius:6px; cursor:pointer; transition:all 0.2s ease;`;
    row.innerHTML = `<div><div style="font-weight:600; font-size:0.95rem; color:var(--text-main);">${track.title}</div><div style="font-size:0.8rem; color:var(--text-muted);">${resolveArtist(track.artist)}</div></div><div style="font-size:0.9rem; color:var(--text-muted); font-family:monospace;">${track.duration || '--:--'}</div>`;
    row.addEventListener('click', () => {
        const event = new CustomEvent('elysium-play-track', { detail: { index } });
        window.dispatchEvent(event);
    });
    box.appendChild(row);
}

export function playTrackAt(module, index) {
    const track = module.tracks[index];
    audioEngine.playTrack(track);
    log('INFO', `Playback started: "${track.title}" by ${track.artist || 'Unknown'} — Duration: ${track.duration || 'N/A'} — Path: ${track.file_path}`);
}

export function highlightRow(module, index) {
    if (!module.viewportElement) return;
    module.viewportElement.querySelectorAll('.track-row-item').forEach(r => {
        r.style.borderLeftColor = 'transparent';
        r.style.background = 'var(--bg-sidebar)';
    });
    const active = module.viewportElement.querySelector(`.track-row-item[data-track-index="${index}"]`);
    if (active) {
        active.style.borderLeftColor = 'var(--accent-premium)';
        active.style.background = 'rgba(138, 92, 246, 0.05)';
    }
}

export function initSkipEngine(module) {
    window.removeEventListener('elysium-skip-next', module._skipHandler);
    window.removeEventListener('elysium-play-track', module._playHandler);
    module._skipHandler = () => {
        if (module.tracks.length === 0) return;
        module.playTrackAt((module.currentTrackIndex + 1) % module.tracks.length);
    };
    module._playHandler = (e) => module.playTrackAt(e.detail.index);
    window.addEventListener('elysium-skip-next', module._skipHandler);
    window.addEventListener('elysium-play-track', module._playHandler);
}

export function initRefreshListener(module) {
    window.removeEventListener('elysium-library-refresh', module._refreshHandler);
    module._refreshHandler = () => {
        if (module.viewportElement) loadLocalTracks(module);
    };
    window.addEventListener('elysium-library-refresh', module._refreshHandler);
}
