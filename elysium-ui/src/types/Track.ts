// src/types/Track.ts
// Shared Track interface — single source of truth for all track data models

export interface Track {
  id: string;
  title: string;
  artist: string;
  file_path: string;
  duration_secs?: number;
  duration?: string;
}
