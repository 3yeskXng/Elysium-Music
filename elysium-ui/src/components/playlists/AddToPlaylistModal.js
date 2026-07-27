// elysium-ui/src/components/playlists/AddToPlaylistModal.js
// Modal for adding the currently playing track to an existing playlist or creating a new one

import { t } from '../../utils/translate.js';
import { ICON_PLAYLIST } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { cacheForPlaylist } from '../../core/cache/audioCache.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function showCreateInline(container, song) {
    const existing = container.querySelector('.inline-create-form');
    if (existing) { existing.remove(); return; }

    const form = document.createElement('div');
    form.className = 'inline-create-form';
    form.style.cssText = 'padding:12px; border-top:1px solid var(--border-subtle);';
    form.innerHTML = `
        <div style="display:flex; gap:8px;">
            <input type="text" id="inline-pl-name" placeholder="${t('pl_name_placeholder')}" style="flex:1; padding:8px 12px;
                background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-radius:6px;
                color:var(--text-main); font-size:0.88rem; outline:none;">
            <button id="inline-pl-confirm" style="padding:8px 14px; background:var(--accent-premium);
                border:none; border-radius:6px; color:white; cursor:pointer; font-weight:600; font-size:0.85rem;">
                ${t('pl_create')}
            </button>
        </div>
    `;
    container.appendChild(form);

    const input = form.querySelector('#inline-pl-name');
    const confirm = form.querySelector('#inline-pl-confirm');
    input.focus();

    const doCreate = async () => {
        const name = input.value.trim();
        if (!name) return;
        try {
            const created = await playlistState.create(name);
            await playlistState.addSong(created.id, song);
            if (song.file_path) cacheForPlaylist(song.id, song.file_path);
            log('INFO', `Created playlist "${name}" and added "${song.title}"`);
            window.dispatchEvent(new CustomEvent('elysium-playlist-created'));
            closeModal();
        } catch (err) {
            log('ERROR', `Create & add failed: ${err.message || err}`);
        }
    };
    confirm.addEventListener('click', doCreate);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doCreate(); });
}

function renderPlaylistOption(playlist, song, container) {
    const option = document.createElement('div');
    option.style.cssText = `
        display:flex; align-items:center; gap:10px; padding:10px 14px;
        cursor:pointer; border-radius:6px; transition:background 0.2s;
    `;
    const alreadyIn = playlist.songs.some(s => s.file_path === song.file_path);
    option.innerHTML = `
        <span style="width:18px; height:18px; display:flex; color:var(--accent-premium);">${ICON_PLAYLIST}</span>
        <span style="flex:1; font-size:0.9rem; color:var(--text-main);">${playlist.name}</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">${playlist.songs.length}</span>
        ${alreadyIn ? `<span style="font-size:0.7rem; color:var(--accent-premium);">${t('pl_already')}</span>` : ''}
    `;
    option.addEventListener('mouseenter', () => option.style.background = 'rgba(255,255,255,0.05)');
    option.addEventListener('mouseleave', () => option.style.background = 'transparent');
    option.addEventListener('click', async () => {
        if (alreadyIn) return;
        try {
            await playlistState.addSong(playlist.id, song);
            if (song.file_path) cacheForPlaylist(song.id, song.file_path);
            log('INFO', `Added "${song.title}" to "${playlist.name}"`);
            closeModal();
        } catch (err) {
            log('ERROR', `Add to playlist failed: ${err.message || err}`);
        }
    });
    container.appendChild(option);
}

let closeModal = () => {};

export function showAddToPlaylistModal(song) {
    if (!song) return;
    const stale = document.getElementById('add-to-playlist-modal');
    if (stale) stale.remove();

    playlistState.load();

    const overlay = document.createElement('div');
    overlay.id = 'add-to-playlist-modal';
    overlay.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
        display:flex; align-items:center; justify-content:center; z-index:10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px;
        padding:0; width:420px; max-width:90vw; max-height:70vh; display:flex; flex-direction:column;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'padding:20px 24px 12px; border-bottom:1px solid var(--border-subtle);';
    header.innerHTML = `
        <h3 style="font-size:1rem; font-weight:600; margin-bottom:4px;">${t('pl_add_to')}</h3>
        <p style="font-size:0.8rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${song.title} ${song.artist ? '- ' + song.artist : ''}
        </p>
    `;
    dialog.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'flex:1; overflow-y:auto; padding:8px 12px;';

    function renderList() {
        listContainer.innerHTML = '';
        playlistState.playlists.forEach(p => renderPlaylistOption(p, song, listContainer));
        if (playlistState.playlists.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:20px; text-align:center; color:var(--text-muted); font-size:0.85rem;';
            empty.textContent = t('pl_empty');
            listContainer.appendChild(empty);
        }
    }
    renderList();
    playlistState.subscribe(renderList);
    dialog.appendChild(listContainer);

    const footer = document.createElement('div');
    footer.style.cssText = 'padding:12px 24px 20px; border-top:1px solid var(--border-subtle);';
    footer.innerHTML = `
        <button id="pl-add-new-btn" style="width:100%; padding:10px; background:rgba(255,255,255,0.03);
            border:1px dashed var(--border-subtle); border-radius:6px; color:var(--text-muted);
            cursor:pointer; font-size:0.88rem; transition:all 0.2s;">
            ${t('pl_new')}
        </button>
    `;
    dialog.appendChild(footer);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    closeModal = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    footer.querySelector('#pl-add-new-btn').addEventListener('click', () => {
        showCreateInline(dialog, song);
    });
}
