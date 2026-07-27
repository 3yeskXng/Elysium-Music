// src/components/lyrics/services/LyricsPanel.ts
// Panel lifecycle — open/close, DOM shell, sync wiring, edit toggle

import { lyricsState } from './lyricsState.js';
import { loadLyrics, type LyricsResult } from './lyricsService.js';
import { startSync, stopSync, scrollActiveIntoView } from './lyricsSync.js';
import { renderContent, renderFooter, updateSourceBadge } from './LyricsRenderer.js';
import { createEditor } from './LyricsEditor.js';
import { ICON_LYRICS } from '../../../config/icons.js';
import { t } from '../../../utils/translate.js';
import type { LyricLine } from './lrcParser.js';

interface Track {
  id: string;
  title: string;
  file_path: string;
}

let overlayEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;
let footerEl: HTMLElement | null = null;
let sourceBadge: HTMLElement | null = null;
let isOpen = false;
let isEditing = false;
let currentResult: LyricsResult | null = null;
let currentTrack: Track | null = null;



function createPanelShell(): void {
  overlayEl = document.createElement('div');
  overlayEl.className = 'lyrics-panel-overlay';

  panelEl = document.createElement('div');
  panelEl.className = 'lyrics-panel';

  const header = document.createElement('div');
  header.className = 'lyrics-panel-header';

  const title = document.createElement('span');
  title.className = 'lyrics-panel-title';
  title.textContent = t('lyricsTitle');

  sourceBadge = document.createElement('span');
  sourceBadge.className = 'lyrics-source-badge';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lyrics-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', close);

  header.appendChild(title);
  header.appendChild(sourceBadge);
  header.appendChild(closeBtn);

  contentEl = document.createElement('div');
  contentEl.className = 'lyrics-content';

  panelEl.appendChild(header);
  panelEl.appendChild(contentEl);
  overlayEl.appendChild(panelEl);
  document.body.appendChild(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) close();
  });
}

function renderPanel(): void {
  if (!contentEl || !currentResult) return;

  if (isEditing) {
    contentEl.innerHTML = '';
    contentEl.appendChild(
      createEditor(
        currentResult.parsed.lines,
        currentTrack?.id ?? '',
        t,
        () => { isEditing = false; refreshCurrentTrack(); },
        () => { isEditing = false; renderPanel(); }
      )
    );
    return;
  }

  const lines: LyricLine[] = currentResult.parsed.lines;
  const state = lyricsState.getState();
  renderContent(contentEl, lines, state.activeIndex, seekToTime, t);

  if (footerEl) footerEl.remove();
  footerEl = renderFooter(currentResult.source, lines.length, t, () => {
    isEditing = true;
    renderPanel();
  });
  if (panelEl && footerEl) panelEl.appendChild(footerEl);

  if (sourceBadge) {
    updateSourceBadge(sourceBadge, currentResult.source, lines.length, t);
  }
}

function seekToTime(time: number): void {
  const audio = document.querySelector('audio') as HTMLAudioElement | null;
  if (audio) audio.currentTime = time;
}

async function refreshCurrentTrack(): Promise<void> {
  if (!currentTrack) return;
  currentResult = await loadLyrics(currentTrack);
  lyricsState.setLyrics(currentTrack.id, currentResult.parsed.lines, currentResult.source);
  renderPanel();
}

export function initLyricsPanel(): void {
  createPanelShell();

  startSync((activeIndex: number) => {
    if (!contentEl || isEditing) return;
    const lines = currentResult?.parsed.lines ?? [];
    renderContent(contentEl, lines, activeIndex, seekToTime, t);
    scrollActiveIntoView(contentEl, activeIndex);
  });
}

export async function loadTrackLyrics(track: Track): Promise<void> {
  currentTrack = track;
  currentResult = await loadLyrics(track);
  lyricsState.setLyrics(track.id, currentResult.parsed.lines, currentResult.source);
  if (isOpen) renderPanel();
}

export function open(): void {
  if (!overlayEl) createPanelShell();
  isOpen = true;
  isEditing = false;
  overlayEl!.classList.add('is-open');
  renderPanel();
}

export function close(): void {
  isOpen = false;
  isEditing = false;
  if (overlayEl) overlayEl.classList.remove('is-open');
}

export function toggle(): void {
  isOpen ? close() : open();
}

export function getToggleIcon(): string {
  return ICON_LYRICS;
}
