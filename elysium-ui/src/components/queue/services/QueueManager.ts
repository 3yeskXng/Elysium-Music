// src/components/queue/services/QueueManager.ts
// Singleton queue service — manages play queue, shuffle, next/previous navigation
// Uses subscriber pattern so UI modules can react to queue changes

import type { Track } from '../../../types/Track.js';

export interface QueueEntry {
  track: Track;
  addedBy: string;
}

type QueueListener = (entries: QueueEntry[], currentIndex: number) => void;

class QueueManagerCore {
  private entries: QueueEntry[] = [];
  private _currentIndex = -1;
  private listeners: Set<QueueListener> = new Set();
  private shuffleMode = false;
  private originalOrder: QueueEntry[] = [];

  get currentIndex(): number {
    return this._currentIndex;
  }

  enqueue(track: Track, addedBy = 'user'): void {
    const entry: QueueEntry = { track, addedBy };
    this.entries.push(entry);
    if (this.shuffleMode) this.originalOrder.push(entry);
    this.notify();
  }

  enqueueAtFront(track: Track, addedBy = 'user'): void {
    const entry: QueueEntry = { track, addedBy };
    this.entries.splice(this._currentIndex + 1, 0, entry);
    if (this.shuffleMode) this.originalOrder.push(entry);
    this.notify();
  }

  dequeue(position: number): void {
    if (position < 0 || position >= this.entries.length) return;
    if (this.shuffleMode) {
      const entry = this.entries[position];
      this.originalOrder = this.originalOrder.filter(e => e !== entry);
    }
    this.entries.splice(position, 1);
    if (position < this._currentIndex) this._currentIndex--;
    if (this._currentIndex >= this.entries.length) this._currentIndex = this.entries.length - 1;
    this.notify();
  }

  move(from: number, to: number): void {
    if (from < 0 || from >= this.entries.length) return;
    if (to < 0 || to >= this.entries.length) return;
    if (from === to) return;
    const [item] = this.entries.splice(from, 1);
    this.entries.splice(to, 0, item);
    if (from === this._currentIndex) {
      this._currentIndex = to;
    } else if (from < this._currentIndex && to >= this._currentIndex) {
      this._currentIndex--;
    } else if (from > this._currentIndex && to <= this._currentIndex) {
      this._currentIndex++;
    }
    this.notify();
  }

  next(): QueueEntry | null {
    if (this._currentIndex + 1 >= this.entries.length) return null;
    this._currentIndex++;
    this.notify();
    return this.entries[this._currentIndex];
  }

  previous(): QueueEntry | null {
    if (this._currentIndex <= 0) return null;
    this._currentIndex--;
    this.notify();
    return this.entries[this._currentIndex];
  }

  setCurrentToTrack(track: Track): void {
    const idx = this.entries.findIndex(e => e.track.id === track.id);
    if (idx !== -1) {
      this._currentIndex = idx;
      this.notify();
    }
  }

  shuffle(): void {
    this.shuffleMode = !this.shuffleMode;
    if (this.shuffleMode) {
      this.originalOrder = [...this.entries];
      const current = this.entries[this._currentIndex];
      const rest = this.entries.filter((_, i) => i !== this._currentIndex);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      this.entries = current ? [current, ...rest] : rest;
      this._currentIndex = current ? 0 : -1;
    } else {
      const current = this.entries[this._currentIndex];
      this.entries = [...this.originalOrder];
      this._currentIndex = current
        ? this.entries.findIndex(e => e.track.id === current.track.id)
        : -1;
      this.originalOrder = [];
    }
    this.notify();
  }

  clear(): void {
    this.entries = [];
    this._currentIndex = -1;
    this.originalOrder = [];
    this.notify();
  }

  getEntries(): QueueEntry[] {
    return [...this.entries];
  }

  getIsShuffled(): boolean {
    return this.shuffleMode;
  }

  subscribe(fn: QueueListener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify(): void {
    const snapshot = this.getEntries();
    for (const fn of this.listeners) fn(snapshot, this._currentIndex);
  }
}

export const queueManager = new QueueManagerCore();
