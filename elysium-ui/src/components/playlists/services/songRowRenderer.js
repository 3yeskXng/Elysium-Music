// elysium-ui/src/components/playlists/services/songRowRenderer.js
// Renders a single song row with play, info, duration, and remove actions

import { t } from '../../../utils/translate.js';
import { ICON_PLAY, ICON_TRASH } from '../../../config/icons.js';
import { playlistState } from './playlistState.js';
import { playSong } from './playlistPlayer.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Playlists', msg);
}

function formatDuration(secs) {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function renderSongRow(song, playlist, onViewChange) {
    const row = document.createElement('div');
    row.style.cssText = `
        display:flex; align-items:center; gap:12px; padding:12px 16px;
        background:var(--bg-sidebar); border:1px solid var(--border-subtle);
        border-radius:6px; transition:all 0.2s;
    `;

    const playBtn = document.createElement('button');
    playBtn.style.cssText = `
        background:var(--accent-premium); border:none; color:white;
        width:32px; height:32px; border-radius:50%; cursor:pointer;
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
    `;
    playBtn.innerHTML = ICON_PLAY;
    playBtn.addEventListener('click', () => playSong(song));

    const info = document.createElement('div');
    info.style.cssText = 'flex:1; min-width:0;';
    info.innerHTML = `
        <div style="font-weight:600; font-size:0.92rem; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${song.title}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">${song.artist || t('artist_unknown')}</div>
    `;

    const duration = document.createElement('span');
    duration.style.cssText = 'font-size:0.85rem; color:var(--text-muted); font-family:monospace; flex-shrink:0;';
    duration.textContent = formatDuration(song.duration_secs);

    const removeBtn = document.createElement('button');
    removeBtn.style.cssText = `
        background:none; border:none; color:var(--text-muted); cursor:pointer;
        padding:4px; display:flex; align-items:center; transition:color 0.2s; flex-shrink:0;
    `;
    removeBtn.innerHTML = ICON_TRASH;
    removeBtn.addEventListener('mouseenter', () => removeBtn.style.color = '#ef4444');
    removeBtn.addEventListener('mouseleave', () => removeBtn.style.color = 'var(--text-muted)');
    removeBtn.addEventListener('click', async () => {
        try {
            await playlistState.removeSong(playlist.id, song.id);
            log('INFO', `Removed "${song.title}" from "${playlist.name}"`);
            if (onViewChange) onViewChange(playlist.id);
        } catch (err) {
            log('ERROR', `Remove song failed: ${err.message || err}`);
        }
    });

    row.appendChild(playBtn);
    row.appendChild(info);
    row.appendChild(duration);
    row.appendChild(removeBtn);
    return row;
}
