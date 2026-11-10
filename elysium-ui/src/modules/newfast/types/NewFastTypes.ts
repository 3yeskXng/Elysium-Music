// src/modules/newfast/types/NewFastTypes.ts
// Shared New Fast Listen contracts used by provider and service layers.

import type { Track } from '../../../types/Track.ts';

export type PlaybackMode = 'classic_download' | 'new_fast_listen';

export interface FastListenProvider {
  id: string;
  name: string;
  resolveStreamUrl(track: Track): Promise<string>;
}

export interface FastListenStreamPayload {
  stream_url: string;
  provider: string;
}
