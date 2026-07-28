// src/components/playlists/services/playlistActions.ts
// Playlist mutation helpers — create, addSong, removeSong with toast feedback

import type { Track } from '../../../types/Track.js';
import { t } from '../../../utils/translate.js';
import { playlistState } from './playlistState';
import { cacheForPlaylist } from '../../../core/cache/audioCache.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function fireToast(type: string, title: string, message: string): void {
  window.dispatchEvent(new CustomEvent('elysium-toast', {
    detail: { type, title, message, duration: 3000 }
  }));
}

export async function createPlaylistWithToast(name: string): Promise<void> {
  try {
    const created = await playlistState.create(name);
    log('INFO', `Playlist created: "${name}"`);
    fireToast('info', t('toast_playlist_created'), name);
    window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Create playlist failed: ${msg}`);
  }
}

export async function createAndAddSongWithToast(
  name: string, song: Track
): Promise<void> {
  try {
    const created = await playlistState.create(name);
    await playlistState.addSong(created.id, song);
    if (song.file_path) cacheForPlaylist(song.id, song.file_path);
    log('INFO', `Created playlist "${name}" and added "${song.title}"`);
    fireToast('info', t('toast_playlist_created'), name);
    window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Create & add failed: ${msg}`);
  }
}

export async function addSongToPlaylistWithToast(
  playlistId: string, playlistName: string, song: Track
): Promise<void> {
  try {
    await playlistState.addSong(playlistId, song);
    if (song.file_path) cacheForPlaylist(song.id, song.file_path);
    log('INFO', `Added "${song.title}" to "${playlistName}"`);
    fireToast('info', t('toast_song_added'), song.title);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Add to playlist failed: ${msg}`);
  }
}
