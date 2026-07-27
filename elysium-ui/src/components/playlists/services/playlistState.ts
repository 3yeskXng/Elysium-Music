// src/components/playlists/services/playlistState.ts
// Reactive playlist state — manages current playlist, list, and change subscribers

import type { Playlist } from '../../../types/Playlist.js';
import type { Track } from '../../../types/Track.js';
import {
  fetchPlaylists,
  createPlaylist as apiCreate,
  deletePlaylist as apiDelete,
  renamePlaylist as apiRename,
  addSongToPlaylist as apiAddSong,
  removeSongFromPlaylist as apiRemoveSong,
} from './playlistApi.js';

type PlaylistStateListener = (playlists: Playlist[], currentId: string | null) => void;

class PlaylistStateCore {
  currentPlaylistId: string | null = null;
  playlists: Playlist[] = [];
  private subscribers: Set<PlaylistStateListener> = new Set();

  subscribe(fn: PlaylistStateListener): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn(this.playlists, this.currentPlaylistId);
    }
  }

  setCurrentPlaylist(id: string | null): void {
    this.currentPlaylistId = id;
    this.notify();
  }

  getCurrentPlaylist(): Playlist | null {
    return this.playlists.find((p) => p.id === this.currentPlaylistId) || null;
  }

  async load(): Promise<Playlist[]> {
    try {
      const result = await fetchPlaylists();
      this.playlists = Array.isArray(result) ? result : [];
    } catch (err: unknown) {
      console.error('[PlaylistState] load failed:', err);
      this.playlists = [];
    }
    this.notify();
    window.dispatchEvent(
      new CustomEvent('elysium-playlists-loaded', {
        detail: this.playlists,
      })
    );
    return this.playlists;
  }

  async create(name: string): Promise<Playlist> {
    const playlist = await apiCreate(name);
    await this.load();
    return playlist;
  }

  async remove(id: string): Promise<void> {
    await apiDelete(id);
    if (this.currentPlaylistId === id) this.currentPlaylistId = null;
    await this.load();
  }

  async rename(id: string, name: string): Promise<Playlist> {
    const updated = await apiRename(id, name);
    await this.load();
    return updated;
  }

  async addSong(playlistId: string, song: Track): Promise<Playlist> {
    const updated = await apiAddSong(playlistId, song);
    await this.load();
    return updated;
  }

  async removeSong(playlistId: string, songId: string): Promise<Playlist> {
    const updated = await apiRemoveSong(playlistId, songId);
    await this.load();
    return updated;
  }
}

export const playlistState = new PlaylistStateCore();
