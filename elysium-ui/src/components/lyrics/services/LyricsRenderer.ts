// src/components/lyrics/services/LyricsRenderer.ts
// DOM rendering for lyrics lines, empty state, and source badge

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
      <div class="lyrics-empty-text">${escapeHtml(t('lyrics_no_lyrics'))}</div>
    </div>
  `;
}

function sourceKeyFor(source: LyricsSource): string {
  const map: Record<LyricsSource, string> = {
    embedded: 'lyrics_source_embedded',
    lrc: 'lyrics_source_lrc',
    custom: 'lyrics_source_custom',
    lrclib: 'lyrics_source_lrclib',
    none: 'lyrics_source_none',
  };
  return map[source] || 'lyrics_source_none';
}

export function renderSourceBadge(
  badge: HTMLElement,
  source: LyricsSource,
  lineCount: number,
  t: (key: string) => string
): void {
  if (source === 'none') {
    badge.textContent = t('lyrics_source_none');
  } else {
    const sourceLabel = t(sourceKeyFor(source));
    badge.textContent = `${sourceLabel} — ${lineCount} ${t('lyrics_lines_label')}`;
  }
}
