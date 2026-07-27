// src/components/queue/PlayerQueue.ts
// Queue panel lifecycle — open/close, DOM shell, state subscription, auto-refresh

import { initQueueState, subscribeQueueState, type QueueState } from './services/queueState.js';
import { queueManager } from './services/QueueManager.js';
import { renderQueueContent } from './QueueRenderer.js';
import { t } from '../../utils/translate.js';

let overlayEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;
let headerCountEl: HTMLElement | null = null;
let isOpen = false;

function createPanelShell(): void {
  overlayEl = document.createElement('div');
  overlayEl.className = 'queue-panel-overlay';

  panelEl = document.createElement('div');
  panelEl.className = 'queue-panel';

  const header = document.createElement('div');
  header.className = 'queue-panel-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'queue-header-left';

  const title = document.createElement('span');
  title.className = 'queue-panel-title';
  title.textContent = t('queue_title');

  headerCountEl = document.createElement('span');
  headerCountEl.className = 'queue-count-badge';

  titleWrap.append(title, headerCountEl);

  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'queue-header-actions';

  const shuffleBtn = document.createElement('button');
  shuffleBtn.className = 'queue-header-btn';
  shuffleBtn.textContent = 'Shuffle';
  shuffleBtn.title = t('queue_shuffle');
  shuffleBtn.addEventListener('click', () => {
    queueManager.shuffle();
    shuffleBtn.classList.toggle('is-active', queueManager.getIsShuffled());
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'queue-header-btn queue-clear-btn';
  clearBtn.textContent = t('queue_clear');
  clearBtn.addEventListener('click', () => queueManager.clear());

  const closeBtn = document.createElement('button');
  closeBtn.className = 'queue-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', close);

  actionsWrap.append(shuffleBtn, clearBtn, closeBtn);
  header.append(titleWrap, actionsWrap);

  contentEl = document.createElement('div');
  contentEl.className = 'queue-content';

  panelEl.append(header, contentEl);
  overlayEl.appendChild(panelEl);
  document.body.appendChild(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) close();
  });
}

function render(state: QueueState): void {
  if (!contentEl) return;
  renderQueueContent(contentEl, state, t);
  if (headerCountEl) {
    const count = state.entries.length;
    headerCountEl.textContent = count > 0 ? `${count}` : '';
  }
}

export function initQueuePanel(): void {
  createPanelShell();
  initQueueState();
  subscribeQueueState((state) => {
    if (isOpen) render(state);
  });
}

export function open(): void {
  if (!overlayEl) createPanelShell();
  isOpen = true;
  overlayEl!.classList.add('is-open');
  render(subscribeQueueState ? {
    entries: queueManager.getEntries(),
    currentIndex: queueManager.currentIndex,
    isShuffled: queueManager.getIsShuffled(),
  } : { entries: [], currentIndex: -1, isShuffled: false });
}

export function close(): void {
  isOpen = false;
  if (overlayEl) overlayEl.classList.remove('is-open');
}

export function toggle(): void {
  isOpen ? close() : open();
}

export function isQueueOpen(): boolean {
  return isOpen;
}
