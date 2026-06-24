// src/modules/PlayerBar.js
import { ICON_PLAY, ICON_PAUSE, ICON_BACK, ICON_FORWARD } from '../config/icons.js';
import { translations } from '../config/translations.js';
import { audioEngine } from '../core/audioEngine.js';

export class PlayerBarModule {
    constructor() {
        this.injectGlobalPlayerBar();
        this.bindAudioEngineHooks();
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
        
        const current = localStorage.getItem('elysium_language') || 'de';
        
        playerBar.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px; width:30%;">
                <div id="player-title" data-i18n="noTrack" style="font-weight:600; font-size:0.9rem; color:var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${translations[current].noTrack}</div>
                <div id="player-status" data-i18n="idleStatus" style="font-size:0.75rem; color:var(--accent-premium); letter-spacing: 1px;">${translations[current].idleStatus}</div>
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
            <div style="width:30%; text-align:right; font-size:0.8rem; color:var(--text-muted); font-family:monospace;" id="player-time">00:00 / 00:00</div>
        `;
        
        document.body.appendChild(playerBar);
        this.bindUserInterfaceControls();
    }

    bindUserInterfaceControls() {
        const playBtn = document.getElementById('player-play-trigger');
        const rewindBtn = document.getElementById('player-rewind');
        const ffBtn = document.getElementById('player-fastforward');
        const progressTrack = document.getElementById('player-progress-track');

        playBtn.addEventListener('click', () => audioEngine.togglePause());

        rewindBtn.addEventListener('click', () => {
            audioEngine.seek(Math.max(0, audioEngine.audio.currentTime - 10));
        });

        ffBtn.addEventListener('click', () => {
            console.log("[Player Core] Skip fast-forward triggered.");
            window.dispatchEvent(new CustomEvent('elysium-skip-next'));
            if (audioEngine.audio) {
                audioEngine.audio.currentTime = audioEngine.audio.duration || 0;
                audioEngine.audio.dispatchEvent(new Event('ended'));
            }
        });

        progressTrack.addEventListener('click', (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            audioEngine.seek(percentage * (audioEngine.audio.duration || 0));
        });
    }

    bindAudioEngineHooks() {
        const titleText = document.getElementById('player-title');
        const statusText = document.getElementById('player-status');
        const playBtn = document.getElementById('player-play-trigger');
        const progressFill = document.getElementById('player-progress-fill');
        const timeText = document.getElementById('player-time');

        audioEngine.onTrackChange((track, status) => {
            titleText.removeAttribute('data-i18n');
            titleText.textContent = track.title;
            statusText.textContent = status.toUpperCase();
            playBtn.innerHTML = status === 'playing' ? ICON_PAUSE : ICON_PLAY;
        });

        audioEngine.onStatusChange((nativeState) => {
            const prog = audioEngine.getProgress();
            progressFill.style.width = `${prog.percent}%`;
            
            if (nativeState === 'playing') {
                statusText.textContent = 'PLAYING';
                playBtn.innerHTML = ICON_PAUSE;
            } else if (nativeState === 'paused') {
                statusText.textContent = 'PAUSED';
                playBtn.innerHTML = ICON_PLAY;
            }

            const curMin = Math.floor(prog.current / 60).toString().padStart(2, '0');
            const curSec = Math.floor(prog.current % 60).toString().padStart(2, '0');
            const totMin = isNaN(prog.total) ? "00" : Math.floor(prog.total / 60).toString().padStart(2, '0');
            const totSec = isNaN(prog.total) ? "00" : Math.floor(prog.total % 60).toString().padStart(2, '0');
            
            timeText.textContent = `${curMin}:${curSec} / ${totMin}:${totSec}`;
        });
    }
}