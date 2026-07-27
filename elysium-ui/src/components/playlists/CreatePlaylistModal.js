// elysium-ui/src/components/playlists/CreatePlaylistModal.js
// Modal dialog for creating a new playlist — name input + confirm/cancel

import { t } from '../../utils/translate.js';
import { playlistState } from './services/playlistState.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

export function showCreatePlaylistModal() {
    if (document.getElementById('create-playlist-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'create-playlist-modal';
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
        display:flex; align-items:center; justify-content:center; z-index:10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px;
        padding:28px; width:400px; max-width:90vw;
    `;

    dialog.innerHTML = `
        <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:20px; color:var(--text-main);">
            ${t('pl_create_title')}
        </h3>
        <input type="text" id="playlist-name-input" placeholder="${t('pl_name_placeholder')}"
            style="width:100%; padding:12px 16px; background:var(--bg-sidebar); border:1px solid var(--border-subtle);
            border-radius:6px; color:var(--text-main); font-size:0.95rem; outline:none; margin-bottom:20px;"
        >
        <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="pl-cancel-btn" style="padding:8px 18px; background:rgba(255,255,255,0.05);
                border:1px solid var(--border-subtle); border-radius:6px; color:var(--text-muted);
                cursor:pointer; font-size:0.9rem;">${t('pl_cancel')}</button>
            <button id="pl-confirm-btn" style="padding:8px 18px; background:var(--accent-premium);
                border:none; border-radius:6px; color:white; cursor:pointer;
                font-weight:600; font-size:0.9rem;">${t('pl_create')}</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = document.getElementById('playlist-name-input');
    const confirmBtn = document.getElementById('pl-confirm-btn');
    const cancelBtn = document.getElementById('pl-cancel-btn');

    input.focus();

    const closeModal = () => overlay.remove();

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    const doCreate = async () => {
        const name = input.value.trim();
        if (!name) return;
        try {
            await playlistState.create(name);
            log('INFO', `Playlist created: "${name}"`);
            closeModal();
            window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
        } catch (err) {
            log('ERROR', `Create playlist failed: ${err.message || err}`);
        }
    };

    confirmBtn.addEventListener('click', doCreate);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doCreate();
    });
}
