// src/components/lyrics/services/sources/lrclibSource.ts
// LRCLIB lyrics source — fetches synced or plain lyrics from lrclib.net API

import type { Track } from '../../../../types/Track.js';
import type { LyricsSourceProvider } from './sourceRegistry.js';

const LRCLIB_API = 'https://lrclib.net/api/get';
const USER_AGENT = 'ElysiumMusic (https://github.com/3yeskXng/Elysium-Music)';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'LRCLIB', msg);
}

export const lrclibProvider: LyricsSourceProvider = {
  id: 'lrclib',
  name: 'LRCLIB',
  priority: 350,

  async resolve(track: Track): Promise<string | null> {
    if (!track.title || !track.artist) return null;

    try {
      const params = new URLSearchParams({
        artist_name: track.artist,
        track_name: track.title,
      });
      const url = `${LRCLIB_API}?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        log('WARN', `LRCLIB returned ${response.status} for: ${track.title}`);
        return null;
      }

      const data = await response.json();

      if (data.syncedLyrics && typeof data.syncedLyrics === 'string' && data.syncedLyrics.trim().length > 0) {
        log('INFO', `LRCLIB synced lyrics found for: ${track.title}`);
        return data.syncedLyrics;
      }

      if (data.plainLyrics && typeof data.plainLyrics === 'string' && data.plainLyrics.trim().length > 0) {
        log('INFO', `LRCLIB plain lyrics found for: ${track.title}`);
        return data.plainLyrics;
      }

      return null;
    } catch (err) {
      log('ERROR', `LRCLIB fetch failed: ${err}`);
      return null;
    }
  },
};
