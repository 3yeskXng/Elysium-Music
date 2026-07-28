// src/components/playlists/services/playlistPlayer.ts
// Playlist song playback — delegates to audioEngine.playTrack for consistent state management

import type { Track } from '../../../types/Track.js';
import { audioEngine } from '../../../core/audioEngine.js';

export async function playSong(song: Track | undefined | null): Promise<void> {
  if (!song || !song.id) {
    throw new Error(
      '[PlaylistPlayer] CRITICAL: track is undefined/null when playSong was called. ' +
      'Caller must pass a valid Track object.'
    );
  }
  await audioEngine.playTrack(song);
}
