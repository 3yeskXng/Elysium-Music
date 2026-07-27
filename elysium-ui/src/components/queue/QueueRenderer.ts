// src/components/queue/QueueRenderer.ts
// DOM rendering for queue entries — current track, upcoming list, empty state

import type { QueueState } from './services/queueState.js';
import { queueManager } from './services/QueueManager.js';
import type { QueueEntry } from './services/QueueManager.js';

type TranslateFn = (key: string) => string;

export function renderQueueContent(
  container: HTMLElement,
  state: QueueState,
  t: TranslateFn,
): void {
  container.innerHTML = '';

  if (state.entries.length === 0) {
    renderEmptyState(container, t);
    return;
  }

  if (state.currentIndex >= 0 && state.currentIndex < state.entries.length) {
    renderCurrentTrack(container, state.entries[state.currentIndex], t);
  }

  renderUpcoming(container, state, t);
}

function renderEmptyState(container: HTMLElement, t: TranslateFn): void {
  const empty = document.createElement('div');
  empty.className = 'queue-empty';

  const icon = document.createElement('div');
  icon.className = 'queue-empty-icon';
  icon.textContent = '♪';

  const text = document.createElement('div');
  text.className = 'queue-empty-text';
  text.textContent = t('queue_empty');

  empty.append(icon, text);
  container.appendChild(empty);
}

function renderCurrentTrack(
  container: HTMLElement,
  entry: QueueEntry,
  t: TranslateFn,
): void {
  const section = document.createElement('div');
  section.className = 'queue-section';

  const label = document.createElement('div');
  label.className = 'queue-section-label';
  label.textContent = t('queue_now_playing');

  const row = createEntryRow(entry, t, true);
  section.append(label, row);
  container.appendChild(section);
}

function renderUpcoming(
  container: HTMLElement,
  state: QueueState,
  t: TranslateFn,
): void {
  const upcoming = state.entries.slice(state.currentIndex + 1);
  if (upcoming.length === 0) return;

  const section = document.createElement('div');
  section.className = 'queue-section';

  const label = document.createElement('div');
  label.className = 'queue-section-label';
  label.textContent = t('queue_upcoming');
  section.appendChild(label);

  upcoming.forEach((entry, i) => {
    const absoluteIndex = state.currentIndex + 1 + i;
    const row = createEntryRow(entry, t, false, absoluteIndex, state.currentIndex);
    section.appendChild(row);
  });

  container.appendChild(section);
}

function createEntryRow(
  entry: QueueEntry,
  t: TranslateFn,
  isCurrent: boolean,
  absoluteIndex?: number,
  currentIndex?: number,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'queue-entry' + (isCurrent ? ' queue-entry-active' : '');

  const info = document.createElement('div');
  info.className = 'queue-entry-info';

  const title = document.createElement('div');
  title.className = 'queue-entry-title';
  title.textContent = entry.track.title || t('noTrack');

  const artist = document.createElement('div');
  artist.className = 'queue-entry-artist';
  artist.textContent = entry.track.artist || '';

  info.append(title, artist);

  const btnWrap = document.createElement('div');
  btnWrap.className = 'queue-entry-actions';

  if (!isCurrent && absoluteIndex !== undefined) {
    const canMoveUp = currentIndex !== undefined && absoluteIndex > currentIndex + 1;

    const moveUpBtn = document.createElement('button');
    moveUpBtn.className = 'queue-entry-btn';
    moveUpBtn.textContent = '↑';
    moveUpBtn.title = t('queue_move_up');
    if (canMoveUp) {
      moveUpBtn.addEventListener('click', (e) => { e.stopPropagation(); queueManager.move(absoluteIndex, absoluteIndex - 1); });
    } else {
      moveUpBtn.disabled = true;
      moveUpBtn.style.opacity = '0.3';
    }

    const moveDownBtn = document.createElement('button');
    moveDownBtn.className = 'queue-entry-btn';
    moveDownBtn.textContent = '↓';
    moveDownBtn.title = t('queue_move_down');
    moveDownBtn.addEventListener('click', (e) => { e.stopPropagation(); queueManager.move(absoluteIndex, absoluteIndex + 1); });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'queue-entry-btn queue-entry-remove';
    removeBtn.textContent = '×';
    removeBtn.title = t('queue_remove');
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); queueManager.dequeue(absoluteIndex); });

    btnWrap.append(moveUpBtn, moveDownBtn, removeBtn);
  }

  row.append(info, btnWrap);
  return row;
}
