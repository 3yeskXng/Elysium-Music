// elysium-ui/src/modules/playlists/PlaylistOverviewView.js
// Playlist overview module — nav button + main content list of all playlists

import { ICON_PLAYLIST } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { playlistState } from '../../components/playlists/services/playlistState.js';
import { showPlaylistView } from '../../components/playlists/PlaylistView.js';
import { showCreatePlaylistModal } from '../../components/playlists/CreatePlaylistModal.js';

const LIST_SELECTOR = 'data-po-list';
const SUBTITLE_SELECTOR = 'data-po-subtitle';

function renderOverviewItem(playlist) {
    const item = document.createElement('div');
    item.style.cssText = `
        display:flex; align-items:center; gap:14px; padding:14px 18px;
        background:var(--bg-card); border:1px solid var(--border-subtle);
        border-radius:8px; cursor:pointer; transition:all 0.2s;
    `;
    item.innerHTML = `
        <span style="width:20px; height:20px; flex-shrink:0; color:var(--accent-premium);">${ICON_PLAYLIST}</span>
        <div style="flex:1; min-width:0;">
            <div style="font-weight:600; font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${playlist.name}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${playlist.songs.length} ${playlist.songs.length === 1 ? t('pl_song') : t('pl_songs')}</div>
        </div>
    `;
    item.addEventListener('mouseenter', () => {
        item.style.borderColor = 'var(--accent-premium)';
        item.style.background = 'rgba(168,85,247,0.05)';
    });
    item.addEventListener('mouseleave', () => {
        item.style.borderColor = 'var(--border-subtle)';
        item.style.background = 'var(--bg-card)';
    });
    item.addEventListener('click', () => showPlaylistView(playlist.id));
    return item;
}

function populateList(container) {
    container.innerHTML = '';
    if (!playlistState.playlists || playlistState.playlists.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:60px; text-align:center; color:var(--text-muted); border:1px dashed var(--border-subtle); border-radius:8px;';
        empty.textContent = t('pl_empty');
        container.appendChild(empty);
    } else {
        playlistState.playlists.forEach(p => container.appendChild(renderOverviewItem(p)));
    }
}

function updateSubtitle(el) {
    const count = playlistState.playlists ? playlistState.playlists.length : 0;
    if (count === 0) {
        el.textContent = t('pl_empty');
    } else {
        // FIX: Richtiger Text für Playlists anstelle von Songs
        el.textContent = `${count} ${count === 1 ? 'Playlist' : 'Playlists'}`;
    }
}

function syncActiveView() {
    const mount = document.getElementById('content-mount-point');
    if (!mount) return;
    const moduleEl = mount.querySelector('[data-module="playlists"]');
    if (!moduleEl) return;

    const listEl = moduleEl.querySelector(`[${LIST_SELECTOR}]`);
    if (listEl) populateList(listEl);

    const subtitleEl = moduleEl.querySelector(`[${SUBTITLE_SELECTOR}]`);
    if (subtitleEl) updateSubtitle(subtitleEl);
}

playlistState.subscribe(syncActiveView);

export const playlistOverviewModule = {
    id: 'playlists',
    label: 'nav_playlists',
    icon: ICON_PLAYLIST,

    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';
        div.dataset.module = 'playlists';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;';

        const titleGroup = document.createElement('div');
        const title = document.createElement('h2');
        title.className = 'view-title';
        title.textContent = t('pl_section');
        titleGroup.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.style.cssText = 'color:var(--text-muted); font-size:0.9rem;';
        subtitle.setAttribute(SUBTITLE_SELECTOR, '');
        
        // FIX: Sicheres Auslesen beim Rendern
        updateSubtitle(subtitle);
        titleGroup.appendChild(subtitle);

        header.appendChild(titleGroup);

        const createBtn = document.createElement('button');
        createBtn.style.cssText = `
            background:var(--accent-premium); border:none; color:white; padding:10px 20px;
            border-radius:6px; cursor:pointer; font-weight:600; font-size:0.9rem;
        `;
        createBtn.textContent = t('pl_new');
        createBtn.addEventListener('click', () => showCreatePlaylistModal());
        header.appendChild(createBtn);
        div.appendChild(header);

        const list = document.createElement('div');
        list.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-bottom:90px;';
        list.setAttribute(LIST_SELECTOR, '');
        
        // FIX: Erzwingt das Füllen aus dem aktuellen playlistState beim Aufrufen des Reiters!
        populateList(list);
        
        div.appendChild(list);

        return div;
    }
};