// elysium-ui/src/components/playlists/PlaylistView.js
// Playlist detail view — header with back/delete, song list, play-all

import { t } from '../../utils/translate.js';
import { ICON_PLAY, ICON_BACK, ICON_TRASH } from '../../config/icons.js';
import { playlistState } from './services/playlistState.js';
import { moduleRegistry } from '../../core/moduleRegistry.js';
import { playSong } from './services/playlistPlayer.js';
import { renderSongRow } from './services/songRowRenderer.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function buildHeader(playlist) {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; gap:16px; margin-bottom:24px;';

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
        background:none; border:none; color:var(--text-muted); cursor:pointer;
        display:flex; align-items:center; transition:color 0.2s;
    `;
    backBtn.innerHTML = ICON_BACK;
    backBtn.addEventListener('click', () => {
        playlistState.setCurrentPlaylist(null);
        moduleRegistry.setActive('playlists');
    });
    backBtn.addEventListener('mouseenter', () => backBtn.style.color = 'var(--text-main)');
    backBtn.addEventListener('mouseleave', () => backBtn.style.color = 'var(--text-muted)');
    header.appendChild(backBtn);

    const titleEl = document.createElement('h2');
    titleEl.className = 'view-title';
    titleEl.textContent = playlist.name;
    header.appendChild(titleEl);

    const spacer = document.createElement('div');
    spacer.style.cssText = 'flex:1;';
    header.appendChild(spacer);

    const deleteBtn = document.createElement('button');
    deleteBtn.style.cssText = `
        background:none; border:1px solid var(--border-subtle); color:var(--text-muted);
        cursor:pointer; padding:6px 12px; border-radius:6px; display:flex;
        align-items:center; gap:6px; font-size:0.82rem; transition:all 0.2s; flex-shrink:0;
    `;
    deleteBtn.innerHTML = `<span style="width:14px; height:14px; display:flex;">${ICON_TRASH}</span> ${t('pl_delete')}`;
    deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.borderColor = '#ef4444';
        deleteBtn.style.color = '#ef4444';
    });
    deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.borderColor = 'var(--border-subtle)';
        deleteBtn.style.color = 'var(--text-muted)';
    });
    deleteBtn.addEventListener('click', async () => {
        try {
            await playlistState.remove(playlist.id);
            log('INFO', `Playlist deleted: "${playlist.name}"`);
            playlistState.setCurrentPlaylist(null);
            moduleRegistry.setActive('playlists');
        } catch (err) {
            log('ERROR', `Delete playlist failed: ${err.message || err}`);
        }
    });
    header.appendChild(deleteBtn);

    return header;
}

function buildSongList(playlist) {
    const songsContainer = document.createElement('div');
    songsContainer.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-bottom:90px;';

    if (playlist.songs.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:40px; text-align:center; color:var(--text-muted); border:1px dashed var(--border-subtle); border-radius:8px;';
        empty.textContent = t('pl_empty');
        songsContainer.appendChild(empty);
    } else {
        playlist.songs.forEach(song => {
            songsContainer.appendChild(renderSongRow(song, playlist, showPlaylistView));
        });
    }

    return songsContainer;
}

export function showPlaylistView(playlistId) {
    const mount = document.getElementById('content-mount-point');
    if (!mount) return;
    mount.innerHTML = '';

    const playlist = playlistState.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const container = document.createElement('div');
    container.className = 'view-container animate-fade-in';

    container.appendChild(buildHeader(playlist));

    const songCount = document.createElement('p');
    songCount.style.cssText = 'color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;';
    songCount.textContent = `${playlist.songs.length} ${playlist.songs.length === 1 ? t('pl_song') : t('pl_songs')}`;
    container.appendChild(songCount);

    if (playlist.songs.length > 0) {
        const playAllBtn = document.createElement('button');
        playAllBtn.style.cssText = `
            background:var(--accent-premium); border:none; color:white;
            padding:10px 24px; border-radius:6px; cursor:pointer;
            font-weight:600; font-size:0.9rem; margin-bottom:24px; display:inline-flex;
            align-items:center; gap:8px; transition:transform 0.1s;
        `;
        playAllBtn.innerHTML = `${ICON_PLAY} ${t('pl_play_all')}`;
        playAllBtn.addEventListener('mouseenter', () => playAllBtn.style.transform = 'scale(1.02)');
        playAllBtn.addEventListener('mouseleave', () => playAllBtn.style.transform = 'scale(1)');
        playAllBtn.addEventListener('click', () => playSong(playlist.songs[0]));
        container.appendChild(playAllBtn);
    }

    container.appendChild(buildSongList(playlist));
    mount.appendChild(container);
}

export function initPlaylistViewListener() {
    window.addEventListener('elysium-open-playlist', (e) => {
        showPlaylistView(e.detail.id);
    });
}
