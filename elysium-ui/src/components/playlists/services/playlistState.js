// elysium-ui/src/components/playlists/services/playlistState.js
// Reactive playlist state — manages current playlist, list, and change subscribers

import { fetchPlaylists, createPlaylist as apiCreate, deletePlaylist as apiDelete, renamePlaylist as apiRename, addSongToPlaylist as apiAddSong, removeSongFromPlaylist as apiRemoveSong } from './playlistApi.js';

class PlaylistState {
    constructor() {
        this.currentPlaylistId = null;
        this.playlists = [];
        this.subscribers = [];
    }

    subscribe(fn) {
        this.subscribers.push(fn);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== fn);
        };
    }

    notify() {
        this.subscribers.forEach(fn => fn(this.playlists, this.currentPlaylistId));
    }

    setCurrentPlaylist(id) {
        this.currentPlaylistId = id;
        this.notify();
    }

    getCurrentPlaylist() {
        return this.playlists.find(p => p.id === this.currentPlaylistId) || null;
    }

    async load() {
        try {
            const result = await fetchPlaylists();
            this.playlists = Array.isArray(result) ? result : [];
        } catch (err) {
            console.error('[PlaylistState] load failed:', err);
            this.playlists = [];
        }
        this.notify();
        window.dispatchEvent(new CustomEvent('elysium-playlists-loaded', {
            detail: this.playlists
        }));
        return this.playlists;
    }

    async create(name) {
        const playlist = await apiCreate(name);
        await this.load();
        return playlist;
    }

    async remove(id) {
        await apiDelete(id);
        if (this.currentPlaylistId === id) this.currentPlaylistId = null;
        await this.load();
    }

    async rename(id, name) {
        const updated = await apiRename(id, name);
        await this.load();
        return updated;
    }

    async addSong(playlistId, song) {
        const updated = await apiAddSong(playlistId, song);
        await this.load();
        return updated;
    }

    async removeSong(playlistId, songId) {
        const updated = await apiRemoveSong(playlistId, songId);
        await this.load();
        return updated;
    }
}

export const playlistState = new PlaylistState();
