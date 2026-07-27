// elysium-ui/src/components/playlists/services/playlistApi.js
// Playlist IPC bridge — wraps all Tauri invoke calls for the playlist system

import { invokeBackend } from '../../../api.js';

export async function fetchPlaylists() {
    return invokeBackend('get_playlists');
}

export async function createPlaylist(name) {
    return invokeBackend('create_playlist', { name });
}

export async function deletePlaylist(id) {
    return invokeBackend('delete_playlist', { id });
}

export async function renamePlaylist(id, name) {
    return invokeBackend('rename_playlist', { id, name });
}

export async function addSongToPlaylist(playlistId, song) {
    return invokeBackend('add_song_to_playlist', {
        playlistId,
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        durationSecs: song.durationSecs || song.duration_secs || 0,
        filePath: song.filePath || song.file_path
    });
}

export async function removeSongFromPlaylist(playlistId, songId) {
    return invokeBackend('remove_song_from_playlist', { playlistId, songId });
}
