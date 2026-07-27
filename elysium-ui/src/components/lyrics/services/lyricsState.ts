// src/components/lyrics/services/lyricsState.ts
// Centralized lyrics state — active line tracking, source info, subscriber pattern

import { findActiveLine, type LyricLine } from './lrcParser.js';
import { type LyricsSource } from './lyricsService.js';

type StateListener = (state: LyricsState) => void;

export interface LyricsState {
  lines: LyricLine[];
  activeIndex: number;
  source: LyricsSource;
  trackId: string | null;
  loading: boolean;
}

class LyricsStateManager {
  private state: LyricsState = {
    lines: [],
    activeIndex: -1,
    source: 'none',
    trackId: null,
    loading: false,
  };

  private listeners: Set<StateListener> = new Set();

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  setLoading(trackId: string): void {
    this.state = { lines: [], activeIndex: -1, source: 'none', trackId, loading: true };
    this.notify();
  }

  setLyrics(trackId: string, lines: LyricLine[], source: LyricsSource): void {
    this.state = { lines, activeIndex: -1, source, trackId, loading: false };
    this.notify();
  }

  clear(): void {
    this.state = { lines: [], activeIndex: -1, source: 'none', trackId: null, loading: false };
    this.notify();
  }

  updateTime(currentTime: number): void {
    if (this.state.lines.length === 0) return;

    const newIndex = findActiveLine(this.state.lines, currentTime);
    if (newIndex !== this.state.activeIndex) {
      this.state.activeIndex = newIndex;
      this.notify();
    }
  }

  getState(): LyricsState {
    return { ...this.state };
  }

  get activeLine(): LyricLine | null {
    if (this.state.activeIndex < 0 || this.state.activeIndex >= this.state.lines.length) {
      return null;
    }
    return this.state.lines[this.state.activeIndex];
  }
}

export const lyricsState = new LyricsStateManager();
