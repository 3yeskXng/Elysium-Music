// src/components/playlists/AddToPlaylistModal.ts
// Modal for adding a track to an existing playlist or creating a new one inline

import type { Track } from '../../types/Track.js';
import { t } from '../../utils/translate.js';
import { ICON_PLAYLIST } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { cacheForPlaylist } from '../../core/cache/audioCache.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function showCreateInline(container: HTMLElement, song: Track): void {
  const existing = container.querySelector('.pl-inline-create');
  if (existing) {
    existing.remove();
    return;
  }

  const form = document.createElement('div');
  form.className = 'pl-inline-create';

  const row = document.createElement('div');
  row.className = 'pl-inline-create-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'pl-inline-create-input';
  input.placeholder = t('pl_name_placeholder');

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'pl-inline-create-confirm';
  confirmBtn.textContent = t('pl_create');

  row.appendChild(input);
  row.appendChild(confirmBtn);
  form.appendChild(row);
  container.appendChild(form);

  input.focus();

  const doCreate = async (): Promise<void> => {
    const name = input.value.trim();
    if (!name) return;
    try {
      const created = await playlistState.create(name);
      await playlistState.addSong(created.id, song);
      if (song.file_path) cacheForPlaylist(song.id, song.file_path);
      log('INFO', `Created playlist "${name}" and added "${song.title}"`);
      window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log('ERROR', `Create & add failed: ${msg}`);
    }
  };

  confirmBtn.addEventListener('click', doCreate);
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') doCreate();
  });
}

function renderPlaylistOption(
  playlist: { id: string; name: string; songs: Track[] },
  song: Track,
  listContainer: HTMLElement
): void {
  const option = document.createElement('div');
  option.className = 'pl-addto-option';

  const alreadyIn = playlist.songs.some((s) => s.file_path === song.file_path);

  option.innerHTML = `
    <span style="width:18px;height:18px;display:flex;color:var(--accent-premium);">${ICON_PLAYLIST}</span>
    <span class="pl-addto-option-name">${playlist.name}</span>
    <span class="pl-addto-option-count">${playlist.songs.length}</span>
    ${alreadyIn ? `<span class="pl-addto-option-badge">${t('pl_already')}</span>` : ''}
  `;

  option.addEventListener('click', async () => {
    if (alreadyIn) return;
    try {
      await playlistState.addSong(playlist.id, song);
      if (song.file_path) cacheForPlaylist(song.id, song.file_path);
      log('INFO', `Added "${song.title}" to "${playlist.name}"`);
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log('ERROR', `Add to playlist failed: ${msg}`);
    }
  });

  listContainer.appendChild(option);
}

let closeModal = (): void => {};

export function showAddToPlaylistModal(song: Track | undefined | null): void {
  if (!song) return;

  const stale = document.getElementById('add-to-playlist-modal');
  if (stale) stale.remove();

  playlistState.load();

  const overlay = document.createElement('div');
  overlay.id = 'add-to-playlist-modal';
  overlay.className = 'pl-modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'pl-modal-dialog pl-modal-dialog--scrollable';

  const header = document.createElement('div');
  header.className = 'pl-addto-header';
  header.innerHTML = `
    <h3 style="font-size:1rem;font-weight:600;margin-bottom:4px;">${t('pl_add_to')}</h3>
    <p class="pl-addto-header-sub">
      ${song.title} ${song.artist ? '- ' + song.artist : ''}
    </p>
  `;
  dialog.appendChild(header);

  const listContainer = document.createElement('div');
  listContainer.className = 'pl-addto-list';

  function renderList(): void {
    listContainer.innerHTML = '';
    playlistState.playlists.forEach((p) =>
      renderPlaylistOption(p, song, listContainer)
    );
    if (playlistState.playlists.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pl-addto-empty';
      empty.textContent = t('pl_empty');
      listContainer.appendChild(empty);
    }
  }

  renderList();
  const unsub = playlistState.subscribe(renderList);
  dialog.appendChild(listContainer);

  const footer = document.createElement('div');
  footer.className = 'pl-addto-footer';

  const newBtn = document.createElement('button');
  newBtn.className = 'pl-addto-new-btn';
  newBtn.textContent = t('pl_new');
  footer.appendChild(newBtn);
  dialog.appendChild(footer);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  closeModal = () => {
    unsub();
    overlay.remove();
  };

  overlay.addEventListener('click', (e: Event) => {
    if (e.target === overlay) closeModal();
  });

  newBtn.addEventListener('click', () => {
    showCreateInline(dialog, song);
  });
}
