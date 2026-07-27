// src/types/Playlist.ts
// Shared Playlist interface — single source of truth for playlist data models

import type { Track } from './Track.js';

export interface Playlist {
  id: string;
  name: string;
  songs: Track[];
}
