// src/components/playlists/services/playlistApi.ts
// Playlist IPC bridge — wraps all Tauri invoke calls for the playlist system

import type { Track } from '../../../types/Track.js';
import type { Playlist } from '../../../types/Playlist.js';
import { invokeBackend } from '../../../api.js';

export async function fetchPlaylists(): Promise<Playlist[]> {
  return invokeBackend('get_playlists') as Promise<Playlist[]>;
}

export async function createPlaylist(name: string): Promise<Playlist> {
  return invokeBackend('create_playlist', { name }) as Promise<Playlist>;
}

export async function deletePlaylist(id: string): Promise<void> {
  return invokeBackend('delete_playlist', { id }) as Promise<void>;
}

export async function renamePlaylist(id: string, name: string): Promise<Playlist> {
  return invokeBackend('rename_playlist', { id, name }) as Promise<Playlist>;
}

export async function addSongToPlaylist(
  playlistId: string,
  song: Track
): Promise<Playlist> {
  return invokeBackend('add_song_to_playlist', {
    playlistId,
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    durationSecs: (song as Record<string, unknown>)['durationSecs'] ?? song.duration_secs ?? 0,
    filePath: (song as Record<string, unknown>)['filePath'] ?? song.file_path,
  }) as Promise<Playlist>;
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<Playlist> {
  return invokeBackend('remove_song_from_playlist', {
    playlistId,
    songId,
  }) as Promise<Playlist>;
}
