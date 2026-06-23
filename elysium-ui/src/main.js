// elysium-ui/src/main.js
import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/downloadModule.js';
import { listenModule } from './modules/listenModule.js';
import { audioEngine } from './core/audioEngine.js';

const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

// Mount core viewport mapping
moduleRegistry.onModuleSwitch((activeModule) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        mountPoint.appendChild(activeModule.render());
    }
});

document.addEventListener('DOMContentLoaded', () => {
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.renderSidebarNavigation();
    
    // Inject global bottom audio control bar HTML & CSS context
    injectGlobalPlayerBar();

    // Force default module view target
    moduleRegistry.setActive('download');
});

function injectGlobalPlayerBar() {
    const playerBar = document.createElement('div');
    playerBar.id = 'global-audio-player-matrix';
    playerBar.style = `
        position: fixed; bottom: 0; left: 0; right: 0; height: 75px;
        background: rgba(14, 14, 17, 0.9); backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-subtle); display: flex;
        align-items: center; justify-content: space-between; padding: 0 24px; z-index: 9999;
    `;
    
    playerBar.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px; width:30%;">
            <div id="player-title" style="font-weight:600; font-size:0.9rem; color:var(--text-main);">Kein Titel</div>
            <div id="player-status" style="font-size:0.75rem; color:var(--text-muted);">Idle</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px; width:40%;">
            <button id="player-play-trigger" style="background:var(--accent-premium); border:none; color:white; font-weight:bold; padding:6px 16px; border-radius:20px; cursor:pointer; font-size:0.8rem;">PLAY / PAUSE</button>
            <div style="width:100%; background:rgba(255,255,255,0.05); height:4px; border-radius:2px; position:relative;">
                <div id="player-progress-fill" style="width:0%; height:100%; background:var(--accent-premium); border-radius:2px; transition: width 0.1s linear;"></div>
            </div>
        </div>
        <div style="width:30%; text-align:right; font-size:0.8rem; color:var(--text-muted); font-family:monospace;" id="player-time">00:00 / 00:00</div>
    `;
    
    document.body.appendChild(playerBar);

    // Wire player-bar interactions directly to backend state emitters
    const playBtn = document.getElementById('player-play-trigger');
    const titleText = document.getElementById('player-title');
    const statusText = document.getElementById('player-status');
    const progressFill = document.getElementById('player-progress-fill');
    const timeText = document.getElementById('player-time');

    playBtn.addEventListener('click', () => {
        const state = audioEngine.togglePause();
        statusText.textContent = state.toUpperCase();
    });

    audioEngine.onTrackChange((track, status) => {
        titleText.textContent = track.title;
        statusText.textContent = status.toUpperCase();
    });

    audioEngine.onStatusChange(() => {
        const prog = audioEngine.getProgress();
        progressFill.style.width = `${prog.percent}%`;
        
        const curMin = Math.floor(prog.current / 60).toString().padStart(2, '0');
        const curSec = Math.floor(prog.current % 60).toString().padStart(2, '0');
        const totMin = isNaN(prog.total) ? "00" : Math.floor(prog.total / 60).toString().padStart(2, '0');
        const totSec = isNaN(prog.total) ? "00" : Math.floor(prog.total % 60).toString().padStart(2, '0');
        
        timeText.textContent = `${curMin}:${curSec} / ${totMin}:${totSec}`;
    });
}