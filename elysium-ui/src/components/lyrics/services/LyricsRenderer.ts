// src/components/lyrics/services/LyricsRenderer.ts
// DOM rendering for lyrics lines, empty state, source badge, and footer

import type { LyricLine } from './lrcParser.js';
import type { LyricsSource } from './lyricsService.js';

function escapeHtml(text: string): string {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}

function formatTimestamp(seconds: number): string {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function renderContent(
  container: HTMLElement,
  lines: LyricLine[],
  activeIndex: number,
  onLineClick: (time: number) => void,
  t: (key: string) => string
): void {
  if (lines.length === 0) {
    renderEmpty(container, t);
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  lines.forEach((line, i) => {
    const div = document.createElement('div');
    div.className = 'lyrics-line' + (i === activeIndex ? ' lyrics-line-active' : '');

    const ts = document.createElement('span');
    ts.className = 'lyrics-timestamp';
    ts.textContent = formatTimestamp(line.time);

    const text = document.createElement('span');
    text.textContent = line.text || '...';

    div.appendChild(ts);
    div.appendChild(text);
    div.addEventListener('click', () => onLineClick(line.time));
    fragment.appendChild(div);
  });

  container.appendChild(fragment);
}

function renderEmpty(container: HTMLElement, t: (key: string) => string): void {
  container.innerHTML = `
    <div class="lyrics-empty">
      <div class="lyrics-empty-icon">♪</div>
      <div class="lyrics-empty-text">${escapeHtml(t('lyricsEmpty'))}</div>
    </div>
  `;
}

export function renderFooter(
  source: LyricsSource,
  lineCount: number,
  t: (key: string) => string,
  onEdit: () => void
): HTMLElement {
  const footer = document.createElement('div');
  footer.className = 'lyrics-panel-footer';

  const badge = document.createElement('span');
  badge.className = 'lyrics-source-badge';
  badge.textContent = source === 'none'
    ? t('lyricsSourceNone')
    : `${t('lyricsSource')}: ${t('lyricsSource_' + source)} (${lineCount} ${t('lyricsLines')})`;

  const editBtn = document.createElement('button');
  editBtn.className = 'lyrics-btn lyrics-btn-secondary';
  editBtn.textContent = t('lyricsEdit');
  editBtn.addEventListener('click', onEdit);

  footer.appendChild(badge);
  footer.appendChild(editBtn);
  return footer;
}

export function updateSourceBadge(
  badge: HTMLElement,
  source: LyricsSource,
  lineCount: number,
  t: (key: string) => string
): void {
  badge.textContent = source === 'none'
    ? t('lyricsSourceNone')
    : `${t('lyricsSource')}: ${t('lyricsSource_' + source)} (${lineCount} ${t('lyricsLines')})`;
}
