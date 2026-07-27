// src/components/playerbar/PlayerActions.ts
// Utility buttons — download, add to playlist (+), lyrics toggle, queue toggle

import { ICON_DOWNLOAD, ICON_PLUS, ICON_LYRICS, ICON_QUEUE } from '../../config/icons.js';
import { toggle as toggleLyrics } from '../lyrics/services/LyricsPanel.js';
import { toggle as toggleQueue } from '../queue/PlayerQueue.js';
import { audioEngine } from '../../core/audioEngine.js';
import { invokeBackend } from '../../api.js';
import { showAddToPlaylistModal } from '../playlists/AddToPlaylistModal.js';
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

  const addBtn = document.createElement('button');
  addBtn.className = 'player-btn';
  addBtn.innerHTML = ICON_PLUS;
  addBtn.title = t('pl_add_playlist');
  addBtn.addEventListener('click', () => {
    const track = audioEngine.currentTrack;
    if (!track) return;
    showAddToPlaylistModal(track);
  });

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

  wrap.append(dlBtn, addBtn, lyricsBtn, queueBtn);
  return wrap;
}
