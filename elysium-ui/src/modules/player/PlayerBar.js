// elysium-ui/src/modules/player/PlayerBar.js
// Global fixed-position player bar — DOM injection, control binding, and playlist action buttons

import { ICON_PLAY, ICON_PAUSE, ICON_BACK, ICON_FORWARD, ICON_DOWNLOAD, ICON_PLUS } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { audioEngine } from '../../core/audioEngine.js';
import { resolveArtist } from '../../utils/resolveArtist.js';
import { bindAudioEngineHooks } from './services/playbackService.js';
import { showAddToPlaylistModal } from '../../components/playlists/AddToPlaylistModal.js';
import { invokeBackend } from '../../api.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Player', msg);
}

export class PlayerBarModule {
    constructor() {
        this.currentTrack = null;
        this.injectGlobalPlayerBar();
        bindAudioEngineHooks(this);
    }

    injectGlobalPlayerBar() {
        if (document.getElementById('global-audio-player-matrix')) return;

        const playerBar = document.createElement('div');
        playerBar.id = 'global-audio-player-matrix';
        playerBar.style = `
            position: fixed; bottom: 0; left: 0; right: 0; height: 75px;
            background: rgba(10, 10, 12, 0.95); backdrop-filter: blur(16px);
            border-top: 1px solid var(--border-subtle); display: flex;
            align-items: center; justify-content: space-between; padding: 0 32px; z-index: 9999;
        `;

        playerBar.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px; width:30%;">
                <div id="player-title" data-i18n="noTrack" style="font-weight:600; font-size:0.9rem; color:var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t('noTrack')}</div>
                <div id="player-status" data-i18n="idleStatus" style="font-size:0.75rem; color:var(--accent-premium); letter-spacing: 1px;">${t('idleStatus')}</div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; gap:10px; width:40%;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <button id="player-rewind" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color 0.2s;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--text-muted)'">${ICON_BACK}</button>
                    <button id="player-play-trigger" style="background:var(--accent-premium); border:none; color:white; width: 40px; height: 40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${ICON_PLAY}
                    </button>
                    <button id="player-fastforward" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color 0.2s;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--text-muted)'">${ICON_FORWARD}</button>
                </div>
                <div id="player-progress-track" style="width:100%; background:rgba(255,255,255,0.08); height:6px; border-radius:3px; position:relative; cursor:pointer;">
                    <div id="player-progress-fill" style="width:0%; height:100%; background:var(--accent-premium); border-radius:3px; position:absolute; left:0; top:0;"></div>
                </div>
            </div>
            <div style="width:30%; display:flex; align-items:center; justify-content:flex-end; gap:12px;">
                <div id="player-action-buttons" style="display:none; gap:8px; align-items:center;">
                    <button id="player-download-btn" style="background:rgba(138,92,246,0.1); border:none; color:var(--accent-premium);
                        width:24px; height:24px; border-radius:50%; cursor:pointer; display:flex;
                        align-items:center; justify-content:center; transition:all 0.2s;" title="${t('pl_download')}">${ICON_DOWNLOAD}</button>
                    <button id="player-add-playlist-btn" style="background:rgba(255,255,255,0.05); border:none; color:var(--text-muted);
                        width:24px; height:24px; border-radius:50%; cursor:pointer; display:flex;
                        align-items:center; justify-content:center; transition:all 0.2s;" title="${t('pl_add_playlist')}">${ICON_PLUS}</button>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); font-family:monospace;" id="player-time">00:00 / 00:00</div>
            </div>
        `;

        document.body.appendChild(playerBar);
        this.bindControls();
    }

    bindControls() {
        document.getElementById('player-play-trigger').addEventListener('click', () => audioEngine.togglePause());

        document.getElementById('player-rewind').addEventListener('click', () => {
            audioEngine.seek(Math.max(0, audioEngine.audio.currentTime - 10));
        });

        document.getElementById('player-fastforward').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('elysium-skip-next'));
            if (audioEngine.audio) {
                audioEngine.audio.currentTime = audioEngine.audio.duration || 0;
                audioEngine.audio.dispatchEvent(new Event('ended'));
            }
        });

        document.getElementById('player-progress-track').addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            audioEngine.seek((e.clientX - rect.left) / rect.width * (audioEngine.audio.duration || 0));
        });

        document.getElementById('player-download-btn').addEventListener('click', async () => {
            if (!this.currentTrack) return;
            try {
                await invokeBackend('download_youtube', { query: this.currentTrack.title });
                log('INFO', `Downloaded via player: "${this.currentTrack.title}"`);
                window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
            } catch (err) {
                log('ERROR', `Player download failed: ${err.message || err}`);
            }
        });

        document.getElementById('player-add-playlist-btn').addEventListener('click', () => {
            if (!this.currentTrack) return;
            showAddToPlaylistModal(this.currentTrack);
        });
    }

    showActionButtons() {
        const btns = document.getElementById('player-action-buttons');
        if (btns) btns.style.display = 'flex';
    }
}
