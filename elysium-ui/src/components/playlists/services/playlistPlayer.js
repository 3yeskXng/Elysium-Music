// elysium-ui/src/components/playlists/services/playlistPlayer.js
// Playlist song playback — loads audio bytes and plays via audioEngine

import { audioEngine } from '../../../core/audioEngine.js';
import { invokeBackend } from '../../../api.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

export async function playSong(song) {
    try {
        const bytes = await invokeBackend('get_track_bytes', { filePath: song.file_path });
        const ext = song.file_path.split('.').pop()?.toLowerCase() || 'opus';
        const mimeMap = { opus: 'audio/opus', mp3: 'audio/mpeg', webm: 'audio/webm' };
        const blob = new Blob([new Uint8Array(bytes)], { type: mimeMap[ext] || 'audio/opus' });
        const url = URL.createObjectURL(blob);
        audioEngine.audio.src = url;
        await audioEngine.audio.play();
        if (audioEngine.onTrackChangeCallback) {
            audioEngine.onTrackChangeCallback(song, 'playing');
        }
        log('INFO', `Playing playlist song: "${song.title}"`);
    } catch (err) {
        log('ERROR', `Failed to play song: ${err.message || err}`);
    }
}
