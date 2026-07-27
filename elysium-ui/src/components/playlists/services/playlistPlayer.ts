// src/components/playlists/services/playlistPlayer.ts
// Playlist song playback — loads audio bytes via IPC and plays through audioEngine
// Validates track objects and throws on undefined to catch broken data early

import type { Track } from '../../../types/Track.js';
import { audioEngine } from '../../../core/audioEngine.js';
import { invokeBackend } from '../../../api.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

export async function playSong(song: Track | undefined | null): Promise<void> {
  if (!song || !song.id) {
    throw new Error(
      '[PlaylistPlayer] CRITICAL: track is undefined/null when playSong was called. ' +
      'Caller must pass a valid Track object.'
    );
  }

  try {
    const bytes: number[] = await invokeBackend('get_track_bytes', {
      filePath: song.file_path,
    });

    const ext = song.file_path.split('.').pop()?.toLowerCase() || 'opus';
    const mimeMap: Record<string, string> = {
      opus: 'audio/opus',
      mp3: 'audio/mpeg',
      webm: 'audio/webm',
    };
    const blob = new Blob([new Uint8Array(bytes)], {
      type: mimeMap[ext] || 'audio/opus',
    });
    const url = URL.createObjectURL(blob);

    audioEngine.audio.src = url;
    await audioEngine.audio.play();

    if (audioEngine.onTrackChangeCallback) {
      audioEngine.onTrackChangeCallback(song, 'playing');
    }

    log('INFO', `Playing playlist song: "${song.title}"`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Failed to play song: ${msg}`);
    throw err;
  }
}
