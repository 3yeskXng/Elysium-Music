// src/components/playlists/CreatePlaylistModal.ts
// Modal dialog for creating a new playlist — name input + confirm/cancel

import { t } from '../../utils/translate.js';
import { playlistState } from './services/playlistState.js';

function log(level: string, msg: string): void {
  if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

export function showCreatePlaylistModal(): void {
  if (document.getElementById('create-playlist-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'create-playlist-modal';
  overlay.className = 'pl-modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'pl-modal-dialog';

  const title = document.createElement('h3');
  title.className = 'pl-modal-title';
  title.textContent = t('pl_create_title');
  dialog.appendChild(title);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'playlist-name-input';
  input.className = 'pl-modal-input';
  input.placeholder = t('pl_name_placeholder');
  dialog.appendChild(input);

  const actions = document.createElement('div');
  actions.className = 'pl-modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'pl-cancel-btn';
  cancelBtn.className = 'pl-modal-btn-cancel';
  cancelBtn.textContent = t('pl_cancel');

  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'pl-confirm-btn';
  confirmBtn.className = 'pl-modal-btn-confirm';
  confirmBtn.textContent = t('pl_create');

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  dialog.appendChild(actions);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  input.focus();

  const closeModal = (): void => overlay.remove();

  const doCreate = async (): Promise<void> => {
    const name = input.value.trim();
    if (!name) return;
    try {
      await playlistState.create(name);
      log('INFO', `Playlist created: "${name}"`);
      closeModal();
      window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log('ERROR', `Create playlist failed: ${msg}`);
    }
  };

  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e: Event) => {
    if (e.target === overlay) closeModal();
  });
  confirmBtn.addEventListener('click', doCreate);
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') doCreate();
  });
}
