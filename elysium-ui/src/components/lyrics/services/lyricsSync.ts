// src/components/lyrics/services/lyricsSync.ts
// Time-sync subscription — highlights active lyrics line based on audio playback position

import { audioEngine } from '../../../core/audioEngine.js';
import { lyricsState } from './lyricsState.js';

type SyncCallback = (activeIndex: number) => void;

const SCROLL_DEBOUNCE_MS = 300;

let unsubscribe: (() => void) | null = null;
let unsubscribeStatusChange: (() => void) | null = null;
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
let onActiveChange: SyncCallback | null = null;

export function startSync(callback: SyncCallback): void {
  stopSync();
  onActiveChange = callback;

  unsubscribe = lyricsState.subscribe((state) => {
    if (state.activeIndex >= 0 && onActiveChange) {
      onActiveChange(state.activeIndex);
    }
  });

  unsubscribeStatusChange = audioEngine.addStatusChangeListener((status: string) => {
    if (status === 'timeupdate') {
      lyricsState.updateTime(audioEngine.audio.currentTime);
    }
  });
}

export function stopSync(): void {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  if (unsubscribeStatusChange) { unsubscribeStatusChange(); unsubscribeStatusChange = null; }
  onActiveChange = null;
}

export function scrollActiveIntoView(container: HTMLElement, activeIndex: number): void {
  if (scrollTimeout) clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    const activeLine = container.querySelector('.lyrics-line-active');
    if (!activeLine || !container) return;

    const panelRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const offset = lineRect.top - panelRect.top - panelRect.height / 2 + lineRect.height / 2;
    container.scrollBy({ top: offset, behavior: 'smooth' });
  }, SCROLL_DEBOUNCE_MS);
}
