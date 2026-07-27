// src/components/playerbar/services/playbackService.ts
// Playback state management — wraps audioEngine with clean subscribe/notify API

import { audioEngine } from '../../../core/audioEngine.js';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

type PlaybackListener = (s: PlaybackState) => void;

const listeners: Set<PlaybackListener> = new Set();

function notify(): void {
  const s = getState();
  for (const fn of listeners) fn(s);
}

export function subscribe(fn: PlaybackListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): PlaybackState {
  return {
    isPlaying: !audioEngine.audio.paused,
    currentTime: audioEngine.audio.currentTime || 0,
    duration: audioEngine.audio.duration || 0,
  };
}

export function togglePlay(): void {
  audioEngine.togglePause();
  notify();
}

export function skipNext(): void {
  audioEngine.audio.dispatchEvent(new Event('ended'));
}

export function skipPrevious(): void {
  audioEngine.seek(0);
}

export function seekTo(time: number): void {
  audioEngine.seek(time);
  notify();
}

audioEngine.onStatusChange(() => notify());
