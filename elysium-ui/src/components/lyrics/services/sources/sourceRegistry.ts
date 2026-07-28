// src/components/lyrics/services/sources/sourceRegistry.ts
// Lyrics source provider registry — register and resolve lyrics from any source via priority chain

import type { Track } from '../../../../types/Track.js';

export interface LyricsSourceProvider {
  id: string;
  name: string;
  priority: number;
  resolve(track: Track): Promise<string | null>;
}

class LyricsSourceRegistry {
  private providers: LyricsSourceProvider[] = [];

  register(provider: LyricsSourceProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  unregister(id: string): void {
    this.providers = this.providers.filter(p => p.id !== id);
  }

  getProviders(): LyricsSourceProvider[] {
    return [...this.providers];
  }

  getProvider(id: string): LyricsSourceProvider | undefined {
    return this.providers.find(p => p.id === id);
  }

  clear(): void {
    this.providers = [];
  }
}

export const lyricsSourceRegistry = new LyricsSourceRegistry();
