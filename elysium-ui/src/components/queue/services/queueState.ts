// src/components/queue/services/queueState.ts
// Queue UI state — bridges QueueManager with panel rendering via subscriber pattern

import { queueManager, type QueueEntry } from './QueueManager.js';

export interface QueueState {
  entries: QueueEntry[];
  currentIndex: number;
  isShuffled: boolean;
}

type QueueStateListener = (state: QueueState) => void;

const stateListeners: Set<QueueStateListener> = new Set();

function emitState(): void {
  const state: QueueState = {
    entries: queueManager.getEntries(),
    currentIndex: queueManager.currentIndex,
    isShuffled: queueManager.getIsShuffled(),
  };
  for (const fn of stateListeners) fn(state);
}

let unsubManager: (() => void) | null = null;

export function initQueueState(): void {
  if (unsubManager) return;
  unsubManager = queueManager.subscribe(() => emitState());
}

export function subscribeQueueState(fn: QueueStateListener): () => void {
  stateListeners.add(fn);
  return () => { stateListeners.delete(fn); };
}

export function getQueueState(): QueueState {
  return {
    entries: queueManager.getEntries(),
    currentIndex: queueManager.currentIndex,
    isShuffled: queueManager.getIsShuffled(),
  };
}
