// src/components/playlists/PlaylistList.ts
// Sidebar playlist list — renders all playlists with create/delete actions

import type { Playlist } from '../../types/Playlist.js';
import { t } from '../../utils/translate.js';
import { ICON_PLAYLIST, ICON_PLUS, ICON_TRASH } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { showCreatePlaylistModal } from './CreatePlaylistModal.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function renderPlaylistItem(playlist: Playlist): HTMLElement {
  const item = document.createElement('div');
  item.className = 'pl-list-item';
  item.dataset.playlistId = playlist.id;

  item.innerHTML = `
    <span class="nav-icon" style="width:16px;height:16px;">${ICON_PLAYLIST}</span>
    <span class="pl-list-item-name">${playlist.name}</span>
    <span class="pl-list-item-count">${playlist.songs.length}</span>
    <button class="pl-list-item-delete" aria-label="${t('pl_delete')}">${ICON_TRASH}</button>
  `;

  item.addEventListener('click', (e: Event) => {
    if ((e.target as Element).closest('.pl-list-item-delete')) return;
    playlistState.setCurrentPlaylist(playlist.id);
    window.dispatchEvent(
      new CustomEvent('elysium-open-playlist', { detail: { id: playlist.id } })
    );
  });

  const deleteBtn = item.querySelector('.pl-list-item-delete') as HTMLButtonElement;
  deleteBtn.addEventListener('click', async (e: Event) => {
    e.stopPropagation();
    try {
      await playlistState.remove(playlist.id);
      log('INFO', `Playlist deleted: "${playlist.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log('ERROR', `Delete playlist failed: ${msg}`);
    }
  });

  return item;
}

let isSubscribed = false;

export function renderPlaylistSidebar(container: HTMLElement | null): void {
  if (!container) return;
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'pl-list-header';
  header.innerHTML = `<span class="pl-list-section-label">${t('pl_section')}</span>`;
  container.appendChild(header);

  const addBtn = document.createElement('button');
  addBtn.className = 'pl-list-add-btn';
  addBtn.innerHTML = `<span style="width:14px;height:14px;display:flex;">${ICON_PLUS}</span> ${t('pl_new')}`;
  addBtn.addEventListener('click', () => showCreatePlaylistModal());
  container.appendChild(addBtn);

  const list = document.createElement('div');
  list.className = 'pl-list-items';

  if (playlistState.playlists.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pl-list-empty';
    empty.textContent = t('pl_empty');
    list.appendChild(empty);
  } else {
    playlistState.playlists.forEach((p) => list.appendChild(renderPlaylistItem(p)));
  }
  container.appendChild(list);

  if (!isSubscribed) {
    isSubscribed = true;
    playlistState.subscribe(() => {
      const el = document.getElementById('sidebar-playlist-slots');
      if (el) renderPlaylistSidebar(el);
    });
  }
}
