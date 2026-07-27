// elysium-ui/src/modules/search/services/trackRowBuilder.js
// Builds a single search result row with play, download, and add-to-playlist actions

import { t } from '../../../utils/translate.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { showAddToPlaylistModal } from '../../../components/playlists/AddToPlaylistModal.js';
import { playStreamTrack } from './streamService.js';
import { invokeBackend } from '../../../api.js';
import { ICON_DOWNLOAD, ICON_PLUS, ICON_QUEUE } from '../../../config/icons.js';
import { queueManager } from '../../../components/queue/services/QueueManager.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Search', msg);
}

export function buildTrackRow(track, container) {
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
        <button class="search-queue-btn" style="background:rgba(255,255,255,0.05); border:none; color:var(--text-muted);
            width:24px; height:24px; border-radius:50%; cursor:pointer; display:flex;
            align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"
            title="${t('queue_add')}">${ICON_QUEUE}</button>
    `;

    row.addEventListener('click', (e) => {
        if (e.target.closest('.search-download-btn') || e.target.closest('.search-add-btn') || e.target.closest('.search-queue-btn')) return;
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
                destPath = await save({ defaultPath: `${track.title || 'track'}.opus`, filters: [{ name: 'Opus Audio', extensions: ['opus'] }] });
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

    row.querySelector('.search-queue-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        queueManager.enqueue(track, 'search');
    });

    row.addEventListener('mouseenter', () => row.style.background = 'rgba(138,92,246,0.05)');
    row.addEventListener('mouseleave', () => row.style.background = 'var(--bg-sidebar)');
    return row;
}
