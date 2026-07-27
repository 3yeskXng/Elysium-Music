// src/components/playerbar/services/playbackService.ts
// Playback state management — uses requestAnimationFrame for smooth progress updates
// and native audio events for play/pause state changes

import { audioEngine } from '../../../core/audioEngine.js';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

type PlaybackListener = (s: PlaybackState) => void;

const listeners: Set<PlaybackListener> = new Set();
let rafId: number | null = null;

function notify(): void {
  const s = getState();
  for (const fn of listeners) fn(s);
}

function startLoop(): void {
  if (rafId !== null) return;
  const tick = (): void => {
    notify();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export function subscribe(fn: PlaybackListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) stopLoop();
  };
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

const audio = audioEngine.audio;
audio.addEventListener('play', () => { notify(); startLoop(); });
audio.addEventListener('pause', () => { notify(); stopLoop(); });
audio.addEventListener('ended', () => { notify(); stopLoop(); });
audio.addEventListener('loadedmetadata', () => notify());
