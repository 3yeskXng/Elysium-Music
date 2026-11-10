// src/modules/newfast/services/NewFastPreferenceService.ts
// Persistent user preference state for selecting legacy or New Fast Listen playback mode.

import type { PlaybackMode } from '../types/NewFastTypes';

const MODE_STORAGE_KEY = 'elysium_playback_mode';
const MODE_CHANGED_EVENT = 'elysium-playback-mode-changed';

function sanitizeMode(mode: string | null): PlaybackMode {
  return mode === 'new_fast_listen' ? 'new_fast_listen' : 'classic_download';
}

export function getPlaybackMode(): PlaybackMode {
  const raw = window.localStorage.getItem(MODE_STORAGE_KEY);
  return sanitizeMode(raw);
}

export function setPlaybackMode(mode: PlaybackMode): void {
  const safe = sanitizeMode(mode);
  window.localStorage.setItem(MODE_STORAGE_KEY, safe);
  window.dispatchEvent(
    new CustomEvent(MODE_CHANGED_EVENT, {
      detail: { mode: safe }
    })
  );
}

export function isNewFastModeSelected(): boolean {
  return getPlaybackMode() === 'new_fast_listen';
}

export function onPlaybackModeChanged(handler: (mode: PlaybackMode) => void): () => void {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ mode?: PlaybackMode }>;
    handler(sanitizeMode(custom.detail?.mode || null));
  };
  window.addEventListener(MODE_CHANGED_EVENT, listener as EventListener);
  return () => window.removeEventListener(MODE_CHANGED_EVENT, listener as EventListener);
}
