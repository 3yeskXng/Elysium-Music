// src/components/playerbar/PlayerTrackActions.ts
// Track-specific action buttons — download and add-to-playlist for the currently playing track

import { ICON_DOWNLOAD, ICON_PLUS } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { audioEngine } from '../../core/audioEngine.js';
import { invokeBackend } from '../../api.js';
import { showAddToPlaylistModal } from '../playlists/AddToPlaylistModal.js';
import type { Track } from '../../types/Track.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'PlayerTrackActions', msg);
}

function getCurrentTrack(): Track | null {
  return audioEngine.currentTrack as Track | null;
}

export function createPlayerTrackActions(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'player-track-actions';

  const dlBtn = document.createElement('button');
  dlBtn.className = 'player-btn pta-dl-btn';
  dlBtn.innerHTML = ICON_DOWNLOAD;
  dlBtn.title = t('pl_download');

  const addBtn = document.createElement('button');
  addBtn.className = 'player-btn pta-add-btn';
  addBtn.innerHTML = ICON_PLUS;
  addBtn.title = t('pl_add_to');

  dlBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const track = getCurrentTrack();
    if (!track) return;

    const original = dlBtn.innerHTML;
    dlBtn.innerHTML = '<span class="pta-spinner"></span>';
    dlBtn.style.pointerEvents = 'none';

    (async () => {
      try {
        let destPath: string | null = null;
        if (window.__TAURI__?.dialog) {
          destPath = await window.__TAURI__.dialog.save({
            defaultPath: `${track.title || 'track'}.opus`,
            filters: [{ name: 'Opus Audio', extensions: ['opus'] }],
          });
        }
        if (destPath === null) {
          dlBtn.innerHTML = original;
          dlBtn.style.pointerEvents = 'auto';
          return;
        }
        await invokeBackend('download_youtube', { query: track.title, destPath });
        window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log('ERROR', `Download failed: ${msg}`);
      } finally {
        dlBtn.innerHTML = original;
        dlBtn.style.pointerEvents = 'auto';
      }
    })();
  });

  addBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const track = getCurrentTrack();
    if (!track) return;
    showAddToPlaylistModal(track);
  });

  wrap.append(dlBtn, addBtn);
  return wrap;
}
