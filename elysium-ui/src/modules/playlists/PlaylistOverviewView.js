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
    item.className = 'pl-overview-item';
    item.innerHTML = `
        <span style="width:20px;height:20px;flex-shrink:0;color:var(--accent-premium);">${ICON_PLAYLIST}</span>
        <div class="pl-overview-item-info">
            <div class="pl-overview-item-name">${playlist.name}</div>
            <div class="pl-overview-item-count">${playlist.songs.length} ${playlist.songs.length === 1 ? t('pl_song') : t('pl_songs')}</div>
        </div>
    `;
    item.addEventListener('click', () => showPlaylistView(playlist.id));
    return item;
}

function populateList(container) {
    container.innerHTML = '';
    if (!playlistState.playlists || playlistState.playlists.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'pl-overview-empty';
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
        el.textContent = `${count} ${count === 1 ? t('pl_song') : t('pl_songs')}`;
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
        header.className = 'pl-overview-header';

        const titleGroup = document.createElement('div');
        const title = document.createElement('h2');
        title.className = 'view-title';
        title.textContent = t('pl_section');
        titleGroup.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.className = 'pl-overview-subtitle';
        subtitle.setAttribute(SUBTITLE_SELECTOR, '');
        updateSubtitle(subtitle);
        titleGroup.appendChild(subtitle);

        header.appendChild(titleGroup);

        const createBtn = document.createElement('button');
        createBtn.className = 'pl-overview-create-btn';
        createBtn.textContent = t('pl_new');
        createBtn.addEventListener('click', () => showCreatePlaylistModal());
        header.appendChild(createBtn);
        div.appendChild(header);

        const list = document.createElement('div');
        list.className = 'pl-overview-list';
        list.setAttribute(LIST_SELECTOR, '');
        populateList(list);
        div.appendChild(list);

        playlistState.load();

        return div;
    }
};
