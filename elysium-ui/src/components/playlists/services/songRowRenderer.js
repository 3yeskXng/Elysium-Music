// elysium-ui/src/components/playlists/services/songRowRenderer.js
// Renders a single song row — track bound to row element via WeakMap
// Zero dependency on audioEngine.currentTrack or any global player state

import { t } from '../../../utils/translate.js';
import { ICON_PLAY, ICON_TRASH, ICON_DOWNLOAD, ICON_PLUS, ICON_QUEUE } from '../../../config/icons.js';
import { playlistState } from './playlistState.js';
import { playSong } from './playlistPlayer.js';
import { showAddToPlaylistModal } from '../AddToPlaylistModal.js';
import { queueManager } from '../../queue/services/QueueManager.js';
import { invokeBackend } from '../../../api.js';

const trackBindMap = new WeakMap();

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function formatDuration(secs) {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function handlePlay(e, row) {
    e.stopPropagation();
    const track = trackBindMap.get(row);
    if (track) playSong(track);
}

function handleDownload(e, row) {
    e.stopPropagation();
    const track = trackBindMap.get(row);
    if (!track) return;
    const btn = row.querySelector('.sr-dl-btn');
    const original = btn.innerHTML;
    btn.innerHTML = '<span style="animation:spin 0.8s linear infinite;display:flex;">⏳</span>';
    btn.style.pointerEvents = 'none';
    (async () => {
        try {
            let destPath = null;
            if (window.__TAURI__ && window.__TAURI__.dialog) {
                const { save } = window.__TAURI__.dialog;
                destPath = await save({
                    defaultPath: `${track.title || 'track'}.opus`,
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
    })();
}

function handleAddToPlaylist(e, row) {
    e.stopPropagation();
    const track = trackBindMap.get(row);
    if (track) showAddToPlaylistModal(track);
}

function handleQueue(e, row) {
    e.stopPropagation();
    const track = trackBindMap.get(row);
    if (track) queueManager.enqueue(track, 'playlist');
}

function handleRemove(e, row, playlist, onViewChange) {
    e.stopPropagation();
    const track = trackBindMap.get(row);
    if (!track) return;
    const removeBtn = row.querySelector('.sr-remove-btn');
    removeBtn.style.color = '#ef4444';
    (async () => {
        try {
            await playlistState.removeSong(playlist.id, track.id);
            log('INFO', `Removed "${track.title}" from "${playlist.name}"`);
            if (onViewChange) onViewChange(playlist.id);
        } catch (err) {
            log('ERROR', `Remove song failed: ${err.message || err}`);
            removeBtn.style.color = '';
        }
    })();
}

export function renderSongRow(song, playlist, onViewChange) {
    const row = document.createElement('div');
    row.className = 'playlist-track-actions';
    row.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 16px;
        background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-radius:6px;
        cursor:pointer; transition:all 0.2s ease;
    `;

    trackBindMap.set(row, song);

    row.innerHTML = `
        <button class="sr-play-btn player-btn player-btn-play" title="${t('pl_play_all')}">${ICON_PLAY}</button>
        <div style="flex:1; min-width:0;">
            <div style="font-weight:600;font-size:0.92rem;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${song.title}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${song.artist || t('artist_unknown')}</div>
        </div>
        <span style="font-size:0.85rem;color:var(--text-muted);font-family:monospace;flex-shrink:0;">${formatDuration(song.duration_secs)}</span>
        <button class="sr-dl-btn player-btn" title="${t('pl_download')}">${ICON_DOWNLOAD}</button>
        <button class="sr-add-btn player-btn" title="${t('pl_add_to')}">${ICON_PLUS}</button>
        <button class="sr-queue-btn player-btn" title="${t('queue_add')}">${ICON_QUEUE}</button>
        <button class="sr-remove-btn player-btn" title="${t('pl_remove')}">${ICON_TRASH}</button>
    `;

    row.querySelector('.sr-play-btn').addEventListener('click', (e) => handlePlay(e, row));
    row.querySelector('.sr-dl-btn').addEventListener('click', (e) => handleDownload(e, row));
    row.querySelector('.sr-add-btn').addEventListener('click', (e) => handleAddToPlaylist(e, row));
    row.querySelector('.sr-queue-btn').addEventListener('click', (e) => handleQueue(e, row));
    row.querySelector('.sr-remove-btn').addEventListener('click', (e) => handleRemove(e, row, playlist, onViewChange));

    row.addEventListener('mouseenter', () => row.style.background = 'rgba(138,92,246,0.05)');
    row.addEventListener('mouseleave', () => row.style.background = 'var(--bg-sidebar)');

    return row;
}
