// elysium-ui/src/components/playlists/services/songRowRenderer.js
// Renders a single song row — same createElement pattern as PlayerBar buttons

import { t } from '../../../utils/translate.js';
import { ICON_PLAY, ICON_TRASH, ICON_DOWNLOAD, ICON_PLUS, ICON_QUEUE } from '../../../config/icons.js';
import { playlistState } from './playlistState.js';
import { playSong } from './playlistPlayer.js';
import { showAddToPlaylistModal } from '../AddToPlaylistModal.js';
import { queueManager } from '../../queue/services/QueueManager.js';
import { invokeBackend } from '../../../api.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function formatDuration(secs) {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function renderSongRow(song, playlist, onViewChange) {
    const row = document.createElement('div');
    row.className = 'playlist-track-actions';
    row.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 16px;
        background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-radius:6px;
        cursor:pointer; transition:all 0.2s ease;
    `;

    const playBtn = document.createElement('button');
    playBtn.className = 'player-btn player-btn-play';
    playBtn.innerHTML = ICON_PLAY;
    playBtn.title = t('pl_play_all');
    playBtn.addEventListener('click', () => playSong(song));

    const info = document.createElement('div');
    info.style.cssText = 'flex:1; min-width:0;';
    info.innerHTML = `
        <div style="font-weight:600;font-size:0.92rem;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${song.title}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);">${song.artist || t('artist_unknown')}</div>
    `;

    const duration = document.createElement('span');
    duration.style.cssText = 'font-size:0.85rem;color:var(--text-muted);font-family:monospace;flex-shrink:0;';
    duration.textContent = formatDuration(song.duration_secs);

    const dlBtn = document.createElement('button');
    dlBtn.className = 'player-btn';
    dlBtn.innerHTML = ICON_DOWNLOAD;
    dlBtn.title = t('pl_download');
    dlBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const original = dlBtn.innerHTML;
        dlBtn.innerHTML = '<span style="animation:spin 0.8s linear infinite;display:flex;">⏳</span>';
        dlBtn.style.pointerEvents = 'none';
        try {
            let destPath = null;
            if (window.__TAURI__ && window.__TAURI__.dialog) {
                const { save } = window.__TAURI__.dialog;
                destPath = await save({ defaultPath: `${song.title || 'track'}.opus`, filters: [{ name: 'Opus Audio', extensions: ['opus'] }] });
            }
            if (destPath === null) return;
            await invokeBackend('download_youtube', { query: song.title, destPath });
            window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
        } catch (err) {
            log('ERROR', `Download failed: ${err.message || err}`);
        } finally {
            dlBtn.innerHTML = original;
            dlBtn.style.pointerEvents = 'auto';
        }
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'player-btn';
    addBtn.innerHTML = ICON_PLUS;
    addBtn.title = t('pl_add_to');
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddToPlaylistModal(song);
    });

    const queueBtn = document.createElement('button');
    queueBtn.className = 'player-btn';
    queueBtn.innerHTML = ICON_QUEUE;
    queueBtn.title = t('queue_add');
    queueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        queueManager.enqueue(song, 'playlist');
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'player-btn';
    removeBtn.innerHTML = ICON_TRASH;
    removeBtn.title = t('pl_remove');
    removeBtn.addEventListener('mouseenter', () => removeBtn.style.color = '#ef4444');
    removeBtn.addEventListener('mouseleave', () => removeBtn.style.color = '');
    removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await playlistState.removeSong(playlist.id, song.id);
            log('INFO', `Removed "${song.title}" from "${playlist.name}"`);
            if (onViewChange) onViewChange(playlist.id);
        } catch (err) {
            log('ERROR', `Remove song failed: ${err.message || err}`);
        }
    });

    row.append(playBtn, info, duration, dlBtn, addBtn, queueBtn, removeBtn);
    row.addEventListener('mouseenter', () => row.style.background = 'rgba(138,92,246,0.05)');
    row.addEventListener('mouseleave', () => row.style.background = 'var(--bg-sidebar)');

    return row;
}
