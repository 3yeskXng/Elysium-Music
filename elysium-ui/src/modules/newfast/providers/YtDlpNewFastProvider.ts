// src/modules/newfast/providers/YtDlpNewFastProvider.ts
// yt-dlp-backed fast listen provider that resolves a direct stream URL through Tauri IPC.

import { invokeBackend } from '../../../api.js';
import type { Track } from '../../../types/Track.ts';
import type { FastListenProvider, FastListenStreamPayload } from '../types/NewFastTypes';

function buildQuery(track: Track): string {
  const title = (track.title || '').trim();
  const artist = (track.artist || '').trim();
  if (artist.length > 0) {
    return `${artist} - ${title}`;
  }
  return title;
}

export const ytdlpNewFastProvider: FastListenProvider = {
  id: 'yt_dlp_newfast',
  name: 'yt-dlp New Fast Listen',

  async resolveStreamUrl(track: Track): Promise<string> {
    const payload = (await invokeBackend('resolve_fast_listen_stream', {
      query: buildQuery(track),
      videoId: track.id || null
    })) as FastListenStreamPayload;

    if (!payload?.stream_url) {
      throw new Error('New Fast Listen provider returned no stream URL.');
    }

    return payload.stream_url;
  }
};
