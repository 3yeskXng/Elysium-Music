// src/components/playerbar/PlayerActions.ts
// Utility buttons — lyrics toggle, queue toggle

import { ICON_LYRICS, ICON_QUEUE } from '../../config/icons.js';
import { toggle as toggleLyrics } from '../lyrics/services/LyricsPanel.js';
import { toggle as toggleQueue } from '../queue/PlayerQueue.js';
import { t } from '../../utils/translate.js';

export function createPlayerActions(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'player-actions';

  const lyricsBtn = document.createElement('button');
  lyricsBtn.className = 'player-btn';
  lyricsBtn.innerHTML = ICON_LYRICS;
  lyricsBtn.title = t('lyrics_title');
  lyricsBtn.addEventListener('click', () => toggleLyrics());

  const queueBtn = document.createElement('button');
  queueBtn.className = 'player-btn';
  queueBtn.innerHTML = ICON_QUEUE;
  queueBtn.title = t('queue_title');
  queueBtn.addEventListener('click', () => toggleQueue());

  wrap.append(lyricsBtn, queueBtn);
  return wrap;
}
