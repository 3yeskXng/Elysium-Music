// src/components/playlists/services/songRowRenderer.ts
// Builds a single playlist song row with play, download, add-to-playlist, queue, and remove actions
// 1:1 structural copy of search/trackRowBuilder.js — closure capture, zero global state

import type { Track } from '../../../types/Track.js';
import type { Playlist } from '../../../types/Playlist.js';
import { t } from '../../../utils/translate.js';
import { ICON_PLAY, ICON_TRASH, ICON_DOWNLOAD, ICON_PLUS, ICON_QUEUE } from '../../../config/icons.js';
import { playSong } from './playlistPlayer';
import { showAddToPlaylistModal } from '../AddToPlaylistModal';
import { playlistState } from './playlistState';
import { queueManager } from '../../queue/services/QueueManager.js';
import { invokeBackend } from '../../../api.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

export function renderSongRow(
  song: Track, playlist: Playlist, onViewChange?: (id: string) => void
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'playlist-track-actions sr-row';

  row.innerHTML = `
    <button class="sr-play-btn player-btn player-btn-play" title="${t('pl_play_all')}">${ICON_PLAY}</button>
    <div class="sr-info">
      <div class="sr-title">${song.title}</div>
      <div class="sr-artist">${song.artist || t('artist_unknown')}</div>
    </div>
    <button class="sr-dl-btn player-btn" title="${t('pl_download')}">${ICON_DOWNLOAD}</button>
    <button class="sr-add-btn player-btn" title="${t('pl_add_to')}">${ICON_PLUS}</button>
    <button class="sr-queue-btn player-btn" title="${t('queue_add')}">${ICON_QUEUE}</button>
    <button class="sr-remove-btn player-btn" title="${t('pl_remove')}">${ICON_TRASH}</button>
  `;

  row.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('.sr-dl-btn') || e.target.closest('.sr-add-btn') ||
        e.target.closest('.sr-queue-btn') || e.target.closest('.sr-remove-btn')) return;
    playSong(song);
  });

  row.querySelector('.sr-add-btn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!song || !song.id) throw new Error('[Playlist] CRITICAL: song is undefined/null in + handler');
    showAddToPlaylistModal(song);
  });

  row.querySelector('.sr-dl-btn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!song || !song.id) throw new Error('[Playlist] CRITICAL: song is undefined/null in Download handler');
    const btn = row.querySelector('.sr-dl-btn') as HTMLButtonElement;
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="sr-spinner">⏳</span>';
    btn.style.pointerEvents = 'none';
    (async () => {
      try {
        let destPath: string | null = null;
        if (window.__TAURI__?.dialog) {
          destPath = await window.__TAURI__.dialog.save({
            defaultPath: `${song.title || 'track'}.opus`,
            filters: [{ name: 'Opus Audio', extensions: ['opus'] }]
          });
        }
        if (destPath === null) return;
        await invokeBackend('download_youtube', { query: song.title, destPath });
        window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log('ERROR', `Download failed: ${msg}`);
      } finally {
        btn.innerHTML = original;
        btn.style.pointerEvents = 'auto';
      }
    })();
  });

  row.querySelector('.sr-queue-btn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    queueManager.enqueue(song, 'playlist');
  });

  row.querySelector('.sr-remove-btn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = row.querySelector('.sr-remove-btn') as HTMLButtonElement;
    btn.style.color = '#ef4444';
    (async () => {
      try {
        await playlistState.removeSong(playlist.id, song.id);
        log('INFO', `Removed "${song.title}" from "${playlist.name}"`);
        if (onViewChange) onViewChange(playlist.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log('ERROR', `Remove song failed: ${msg}`);
        btn.style.color = '';
      }
    })();
  });

  row.addEventListener('mouseenter', () => row.classList.add('sr-row--hover'));
  row.addEventListener('mouseleave', () => row.classList.remove('sr-row--hover'));

  return row;
}
