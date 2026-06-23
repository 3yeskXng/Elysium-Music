// elysium-ui/src/main.js
import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/downloadModule.js';
import { listenModule } from './modules/listenModule.js';
import { audioEngine } from './core/audioEngine.js';

// --- UI ICONS (SVG) ---
const ICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><polygon points="6 2 22 12 6 22 6 2"></polygon></svg>`;
const ICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><rect x="5" y="2" width="4" height="20"></rect><rect x="15" y="2" width="4" height="20"></rect></svg>`;
const ICON_BACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg>`;
const ICON_FORWARD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon></svg>`;
const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

// --- INTERNATIONALIZATION (i18n) ENGINE ---
const translations = {
    de: {
        appTitle: "Elysium",
        settingsTitle: "Einstellungen",
        settingsSub: "Konfiguration der Systemschnittstellen.",
        langLabel: "Sprache / Language",
        idleStatus: "BEREIT",
        noTrack: "Kein Titel"
    },
    en: {
        appTitle: "Elysium Premium",
        settingsTitle: "Settings",
        settingsSub: "Configuration of system interfaces.",
        langLabel: "Language / Sprache",
        idleStatus: "IDLE",
        noTrack: "No Track Loaded"
    }
};

// Global language switcher with local storage persistence
window.elysiumTranslate = function(lang) {
    localStorage.setItem('elysium_language', lang);
    document.documentElement.lang = lang;
    
    // Update all static and dynamic elements matching data-i18n tags
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
};

// Retrieve saved language configuration on launch sequence (default to German)
const savedLanguage = localStorage.getItem('elysium_language') || 'de';

// --- FULLY MODULAR STREAMING PLUGIN SYSTEM ---
class ElysiumPluginManager {
    constructor() {
        this.activePlugins = new Map();
    }

    // Hot-plug a new streaming architecture blueprint (YouTube, Spotify, etc.)
    registerPlugin(pluginInstance) {
        if (!pluginInstance.id || typeof pluginInstance.search !== 'function') {
            console.error(`[Plugins] Rejected invalid module structure.`);
            return;
        }
        this.activePlugins.set(pluginInstance.id, pluginInstance);
        console.log(`[Plugins] Loaded streaming pipeline source: ${pluginInstance.name}`);
    }

    // Safely eject a module from the ecosystem instantly
    unregisterPlugin(pluginId) {
        if (this.activePlugins.has(pluginId)) {
            this.activePlugins.delete(pluginId);
            console.log(`[Plugins] Ejected streaming pipeline source: ${pluginId}`);
        }
    }

    // Dispatches search queries across all hot-swapped streaming nodes
    async fetchUnifiedResults(query) {
        const jobs = Array.from(this.activePlugins.values()).map(async (plugin) => {
            try {
                return await plugin.search(query);
            } catch (err) {
                console.error(`[Plugins] Execution fault on source "${plugin.id}":`, err);
                return [];
            }
        });
        const responses = await Promise.all(jobs);
        return responses.flat(); // Flattens all platform arrays into a single stream
    }
}

export const pluginManager = new ElysiumPluginManager();

// --- SETTINGS MODULE COMPONENT ---
const settingsModule = {
    id: 'settings',
    label: 'Einstellungen',
    icon: ICON_SETTINGS,
    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';
        
        const current = localStorage.getItem('elysium_language') || 'de';
        
        div.innerHTML = `
            <h2 class="view-title" data-i18n="settingsTitle">${translations[current].settingsTitle}</h2>
            <p style="color:var(--text-muted); margin-bottom: 24px;" data-i18n="settingsSub">${translations[current].settingsSub}</p>
            <div style="background: var(--bg-sidebar); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 8px;">
                <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 10px; font-size:0.9rem;" data-i18n="langLabel">${translations[current].langLabel}</label>
                <select id="language-select" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; outline: none; cursor: pointer;">
                    <option value="de" ${current === 'de' ? 'selected' : ''}>Deutsch</option>
                    <option value="en" ${current === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>
        `;

        // Direct event binding to prevent race-conditions or view-state failure
        div.querySelector('#language-select').addEventListener('change', (e) => {
            window.elysiumTranslate(e.target.value);
        });

        return div;
    }
};

// --- CORE APP LIFECYCLE INITIALIZATION ---
moduleRegistry.onModuleSwitch((activeModule) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        mountPoint.appendChild(activeModule.render());
        // Re-execute translation scan over newly mounted elements to prevent F5 lockouts
        const current = localStorage.getItem('elysium_language') || 'de';
        window.elysiumTranslate(current);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.renderSidebarNavigation();
    
    injectGlobalPlayerBar();
    moduleRegistry.setActive('download');

    // Run localized string mapping injection instantly on startup
    window.elysiumTranslate(savedLanguage);
});

// --- GLOBAL AUDIO CONTROL CORE DESK ---
function injectGlobalPlayerBar() {
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

    const playBtn = document.getElementById('player-play-trigger');
    const rewindBtn = document.getElementById('player-rewind');
    const ffBtn = document.getElementById('player-fastforward');
    const titleText = document.getElementById('player-title');
    const statusText = document.getElementById('player-status');
    const progressTrack = document.getElementById('player-progress-track');
    const progressFill = document.getElementById('player-progress-fill');
    const timeText = document.getElementById('player-time');

    playBtn.addEventListener('click', () => audioEngine.togglePause());

    // Skip Backwards: Rewind active track position by 10 seconds
    rewindBtn.addEventListener('click', () => {
        audioEngine.seek(Math.max(0, audioEngine.audio.currentTime - 10));
    });

    // FIXED: Skip Forward now triggers the actual playlist advancement on the engine, instead of just skipping 10 seconds
    ffBtn.addEventListener('click', () => {
        if (typeof audioEngine.next === 'function') {
            audioEngine.next();
        } else if (typeof audioEngine.skip === 'function') {
            audioEngine.skip();
        } else if (typeof audioEngine.nextTrack === 'function') {
            audioEngine.nextTrack();
        } else {
            // Native fallback invocation if no dedicated next mapping is registered
            audioEngine.audio.dispatchEvent(new Event('ended'));
        }
    });

    progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioEngine.seek(percentage * (audioEngine.audio.duration || 0));
    });

    audioEngine.onTrackChange((track, status) => {
        titleText.removeAttribute('data-i18n'); // Remove placeholder attribute once dynamic track metadata takes over
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