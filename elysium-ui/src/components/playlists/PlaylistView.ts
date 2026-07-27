// src/components/playlists/PlaylistView.ts
// Playlist detail view — header with back/delete, song count, play-all, song list

import type { Playlist } from '../../types/Playlist.js';
import { t } from '../../utils/translate.js';
import { ICON_PLAY, ICON_BACK, ICON_TRASH } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { moduleRegistry } from '../../core/moduleRegistry.js';
import { playSong } from './services/playlistPlayer.js';
import { renderSongRow } from './services/songRowRenderer.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function buildHeader(playlist: Playlist): HTMLElement {
  const header = document.createElement('div');
  header.className = 'pl-detail-header';

  const backBtn = document.createElement('button');
  backBtn.className = 'pl-detail-back-btn';
  backBtn.innerHTML = ICON_BACK;
  backBtn.addEventListener('click', () => {
    playlistState.setCurrentPlaylist(null);
    moduleRegistry.setActive('playlists');
  });
  header.appendChild(backBtn);

  const titleEl = document.createElement('h2');
  titleEl.className = 'view-title';
  titleEl.textContent = playlist.name;
  header.appendChild(titleEl);

  const spacer = document.createElement('div');
  spacer.className = 'pl-detail-spacer';
  header.appendChild(spacer);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'pl-detail-delete-btn';
  deleteBtn.innerHTML = `<span style="width:14px;height:14px;display:flex;">${ICON_TRASH}</span> ${t('pl_delete')}`;
  deleteBtn.addEventListener('click', async () => {
    try {
      await playlistState.remove(playlist.id);
      log('INFO', `Playlist deleted: "${playlist.name}"`);
      playlistState.setCurrentPlaylist(null);
      moduleRegistry.setActive('playlists');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log('ERROR', `Delete playlist failed: ${msg}`);
    }
  });
  header.appendChild(deleteBtn);

  return header;
}

function buildSongList(
  playlist: Playlist,
  refreshView: (id: string) => void
): HTMLElement {
  const songsContainer = document.createElement('div');
  songsContainer.className = 'pl-detail-song-list';

  if (playlist.songs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pl-detail-empty';
    empty.textContent = t('pl_empty');
    songsContainer.appendChild(empty);
  } else {
    playlist.songs.forEach((song) => {
      songsContainer.appendChild(renderSongRow(song, playlist, refreshView));
    });
  }

  return songsContainer;
}

export function showPlaylistView(playlistId: string): void {
  const mount = document.getElementById('content-mount-point');
  if (!mount) return;
  mount.innerHTML = '';

  const playlist = playlistState.playlists.find((p) => p.id === playlistId);
  if (!playlist) return;

  const container = document.createElement('div');
  container.className = 'view-container animate-fade-in';

  container.appendChild(buildHeader(playlist));

  const songCount = document.createElement('p');
  songCount.className = 'pl-detail-count';
  const countText = playlist.songs.length === 1 ? t('pl_song') : t('pl_songs');
  songCount.textContent = `${playlist.songs.length} ${countText}`;
  container.appendChild(songCount);

  if (playlist.songs.length > 0) {
    const playAllBtn = document.createElement('button');
    playAllBtn.className = 'pl-detail-play-all';
    playAllBtn.innerHTML = `${ICON_PLAY} ${t('pl_play_all')}`;
    playAllBtn.addEventListener('click', () => {
      playSong(playlist.songs[0]);
    });
    container.appendChild(playAllBtn);
  }

  container.appendChild(buildSongList(playlist, showPlaylistView));
  mount.appendChild(container);
}

export function initPlaylistViewListener(): void {
  window.addEventListener('elysium-open-playlist', ((e: CustomEvent) => {
    showPlaylistView(e.detail.id);
  }) as EventListener);
}
