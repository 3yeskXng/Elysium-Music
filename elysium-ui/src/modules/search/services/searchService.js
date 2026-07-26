// elysium-ui/src/modules/search/services/searchService.js
// Search handler — local library search + YouTube stream search delegation

import { invokeBackend } from '../../../api.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { t } from '../../../utils/translate.js';
import { showAddToPlaylistModal } from '../../../components/playlists/AddToPlaylistModal.js';
import { handleStreamSearch, playStreamTrack } from './streamService.js';
import { ICON_DOWNLOAD, ICON_PLUS } from '../../../config/icons.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Search', msg);
}

export function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

export function renderTrackResult(container, track) {
    const row = document.createElement('div');
    row.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 16px;
        background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-radius:6px;
        cursor:pointer; transition:all 0.2s ease;
    `;
    row.innerHTML = `
        <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:0.95rem; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${track.title}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${track.artist || t('artist_unknown')}</div>
        </div>
        <div style="font-size:0.9rem; color:var(--text-muted); font-family:monospace; flex-shrink:0;">${track.duration || '--:--'}</div>
        <button class="search-download-btn" style="background:rgba(138,92,246,0.1); border:none; color:var(--accent-premium);
            width:24px; height:24px; border-radius:50%; cursor:pointer; display:flex;
            align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"
            title="${t('dl_btn')}">${ICON_DOWNLOAD}</button>
        <button class="search-add-btn" style="background:rgba(255,255,255,0.05); border:none; color:var(--text-muted);
            width:24px; height:24px; border-radius:50%; cursor:pointer; display:flex;
            align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"
            title="${t('pl_add_to')}">${ICON_PLUS}</button>
    `;

    row.addEventListener('click', (e) => {
        if (e.target.closest('.search-download-btn') || e.target.closest('.search-add-btn')) return;
        if (track.file_path) {
            audioEngine.playTrack(track);
        } else {
            playStreamTrack(track, container);
        }
    });

    row.querySelector('.search-download-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = row.querySelector('.search-download-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<span style="animation:spin 0.8s linear infinite;display:flex;">⏳</span>';
        btn.style.pointerEvents = 'none';
        try {
            let destPath = null;
            if (window.__TAURI__ && window.__TAURI__.dialog) {
                const { save } = window.__TAURI__.dialog;
                const defaultName = `${track.title || 'track'}.opus`;
                destPath = await save({
                    defaultPath: defaultName,
                    filters: [{ name: 'Opus Audio', extensions: ['opus'] }]
                });
            }
            if (destPath === null) return;
            await invokeBackend('download_youtube', { query: track.title, destPath });
            window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
        } catch (err) {
            log('ERROR', `Download failed: ${err.message || err}`);
        } finally {
            btn.innerHTML = original;
            btn.style.pointerEvents = 'auto';
        }
    });

    row.querySelector('.search-add-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showAddToPlaylistModal(track);
    });

    row.addEventListener('mouseenter', () => row.style.background = 'rgba(138,92,246,0.05)');
    row.addEventListener('mouseleave', () => row.style.background = 'var(--bg-sidebar)');
    container.appendChild(row);
}

export async function handleSearch(input, resultsContainer, statusBox) {
    const query = input.value.trim();
    if (!query) return;

    showLoader(resultsContainer, t('search_loading'));
    setStatus(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', t('search_searching'));

    try {
        const localResults = await searchLocal(query);
        if (localResults.length > 0) {
            hideLoader(resultsContainer);
            resultsContainer.innerHTML = '';
            localResults.forEach(track => renderTrackResult(resultsContainer, track));
            setStatus(statusBox, 'rgba(34,197,94,0.1)', '#22c55e',
                t('search_found_local').replace('${count}', localResults.length));
        } else {
            await handleStreamSearch(query, statusBox, resultsContainer);
        }
    } catch (err) {
        hideLoader(resultsContainer);
        setStatus(statusBox, 'rgba(239,68,68,0.1)', '#ef4444',
            `${t('dl_error')}: ${err.message || err}`);
    }
}

async function searchLocal(query) {
    try {
        const allTracks = await invokeBackend('scan_local_library');
        return allTracks.filter(t =>
            t.title.toLowerCase().includes(query.toLowerCase()) ||
            (t.artist && t.artist.toLowerCase().includes(query.toLowerCase()))
        );
    } catch (_) {
        return [];
    }
}
