// src/components/lyrics/services/LyricsEditor.ts
// Lyrics edit/save logic — textarea creation, save handler, cancel handler

import { saveCustomLyrics } from './lyricsService.js';
import { formatLrcTime } from './lrcParser.js';
import type { LyricLine } from './lrcParser.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Lyrics', msg);
}

export function createEditor(
  lines: LyricLine[],
  trackId: string,
  t: (key: string) => string,
  onSave: () => void,
  onCancel: () => void
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'lyrics-editor';

  const label = document.createElement('div');
  label.className = 'lyrics-editor-label';
  label.textContent = t('lyricsEditorLabel');

  const textarea = document.createElement('textarea');
  textarea.value = lines.length > 0
    ? lines.map(l => `[${formatLrcTime(l.time)}] ${l.text}`).join('\n')
    : '';

  const footer = document.createElement('div');
  footer.className = 'lyrics-editor-footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'lyrics-btn lyrics-btn-secondary';
  cancelBtn.textContent = t('lyricsCancel');
  cancelBtn.addEventListener('click', onCancel);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'lyrics-btn lyrics-btn-primary';
  saveBtn.textContent = t('lyricsSave');
  saveBtn.addEventListener('click', async () => {
    try {
      await saveCustomLyrics(trackId, textarea.value);
      log('INFO', `Lyrics saved for track: ${trackId}`);
      onSave();
    } catch (err) {
      log('ERROR', `Failed to save lyrics: ${err}`);
    }
  });

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
  wrapper.appendChild(label);
  wrapper.appendChild(textarea);
  wrapper.appendChild(footer);
  return wrapper;
}
