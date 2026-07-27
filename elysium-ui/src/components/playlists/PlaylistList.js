// elysium-ui/src/components/playlists/PlaylistList.js
// Sidebar playlist list — renders all playlists with create/delete actions

import { t } from '../../utils/translate.js';
import { ICON_PLAYLIST, ICON_PLUS, ICON_TRASH } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { showCreatePlaylistModal } from './CreatePlaylistModal.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function renderPlaylistItem(playlist) {
    const item = document.createElement('div');
    item.className = 'playlist-sidebar-item';
    item.dataset.playlistId = playlist.id;
    item.style.cssText = `
        display:flex; align-items:center; gap:10px; padding:10px 12px;
        background:transparent; border:1px solid transparent; border-radius:6px;
        cursor:pointer; transition:all 0.2s ease; width:100%; text-align:left;
        color:var(--text-muted); font-size:0.88rem;
    `;
    item.innerHTML = `
        <span class="nav-icon" style="width:16px; height:16px;">${ICON_PLAYLIST}</span>
        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${playlist.name}</span>
        <span style="font-size:0.75rem; opacity:0.5; margin-right:4px;">${playlist.songs.length}</span>
        <button class="playlist-delete-btn" style="background:none; border:none; color:var(--text-muted);
            cursor:pointer; padding:2px 4px; display:none; transition:color 0.2s; flex-shrink:0;">${ICON_TRASH}</button>
    `;

    item.addEventListener('click', (e) => {
        if (e.target.closest('.playlist-delete-btn')) return;
        playlistState.setCurrentPlaylist(playlist.id);
        window.dispatchEvent(new CustomEvent('elysium-open-playlist', { detail: { id: playlist.id } }));
    });

    const deleteBtn = item.querySelector('.playlist-delete-btn');
    deleteBtn.addEventListener('mouseenter', () => deleteBtn.style.color = '#ef4444');
    deleteBtn.addEventListener('mouseleave', () => deleteBtn.style.color = 'var(--text-muted)');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await playlistState.remove(playlist.id);
            log('INFO', `Playlist deleted: "${playlist.name}"`);
        } catch (err) {
            log('ERROR', `Delete playlist failed: ${err.message || err}`);
        }
    });

    item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'var(--border-subtle)';
        deleteBtn.style.display = 'flex';
    });
    item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.borderColor = 'transparent';
        deleteBtn.style.display = 'none';
    });

    return item;
}

let isSubscribed = false;

export function renderPlaylistSidebar(container) {
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;';
    header.innerHTML = `
        <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted);">${t('pl_section')}</span>
    `;
    container.appendChild(header);

    const addBtn = document.createElement('button');
    addBtn.style.cssText = `
        display:flex; align-items:center; gap:6px; padding:8px 10px; width:100%;
        background:transparent; border:1px dashed var(--border-subtle); border-radius:6px;
        color:var(--text-muted); cursor:pointer; font-size:0.85rem; transition:all 0.2s;
    `;
    addBtn.innerHTML = `<span style="width:14px; height:14px; display:flex;">${ICON_PLUS}</span> ${t('pl_new')}`;
    addBtn.addEventListener('click', () => showCreatePlaylistModal());
    addBtn.addEventListener('mouseenter', () => {
        addBtn.style.borderColor = 'var(--accent-premium)';
        addBtn.style.color = 'var(--accent-premium)';
    });
    addBtn.addEventListener('mouseleave', () => {
        addBtn.style.borderColor = 'var(--border-subtle)';
        addBtn.style.color = 'var(--text-muted)';
    });
    container.appendChild(addBtn);

    const list = document.createElement('div');
    list.id = 'playlist-sidebar-list';
    list.style.cssText = 'display:flex; flex-direction:column; gap:2px; margin-top:6px;';

    if (playlistState.playlists.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:12px; text-align:center; font-size:0.8rem; color:var(--text-muted); opacity:0.5;';
        empty.textContent = t('pl_empty');
        list.appendChild(empty);
    } else {
        playlistState.playlists.forEach(p => list.appendChild(renderPlaylistItem(p)));
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
