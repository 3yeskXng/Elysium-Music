// src/components/playerbar/PlayerActions.ts
// Utility buttons — download, playlist queue, lyrics toggle

import { ICON_DOWNLOAD, ICON_PLAYLIST, ICON_LYRICS } from '../../config/icons.js';
import { toggle as toggleLyrics } from '../lyrics/services/LyricsPanel.js';
import { audioEngine } from '../../core/audioEngine.js';
import { invokeBackend } from '../../api.js';
import { t } from '../../utils/translate.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Player', msg);
}

export function createPlayerActions(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'player-actions';

  const dlBtn = document.createElement('button');
  dlBtn.className = 'player-btn';
  dlBtn.innerHTML = ICON_DOWNLOAD;
  dlBtn.title = t('pl_download');
  dlBtn.addEventListener('click', async () => {
    const track = audioEngine.currentTrack;
    if (!track) return;
    try {
      let destPath: string | null = null;
      if ((window as any).__TAURI__?.dialog) {
        const { save } = (window as any).__TAURI__.dialog;
        destPath = await save({
          defaultPath: `${track.title || 'track'}.opus`,
          filters: [{ name: 'Opus Audio', extensions: ['opus'] }],
        });
      }
      if (destPath === null) return;
      await invokeBackend('download_youtube', { query: track.title, destPath });
      log('INFO', `Downloaded: "${track.title}" → ${destPath}`);
      window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
    } catch (err) {
      log('ERROR', `Download failed: ${err}`);
    }
  });

  const queueBtn = document.createElement('button');
  queueBtn.className = 'player-btn';
  queueBtn.innerHTML = ICON_PLAYLIST;
  queueBtn.title = t('pl_add_playlist');
  queueBtn.addEventListener('click', () => {
    const track = audioEngine.currentTrack;
    if (!track) return;
    window.dispatchEvent(new CustomEvent('elysium-add-to-playlist', { detail: track }));
  });

  const lyricsBtn = document.createElement('button');
  lyricsBtn.className = 'player-btn';
  lyricsBtn.innerHTML = ICON_LYRICS;
  lyricsBtn.title = t('lyrics_title');
  lyricsBtn.addEventListener('click', () => toggleLyrics());

  wrap.append(dlBtn, queueBtn, lyricsBtn);
  return wrap;
}
