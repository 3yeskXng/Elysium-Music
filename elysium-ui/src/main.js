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

// --- TRANSLATION MATRIX (i18n) ---
const translations = {
    de: {
        appTitle: "Elysium",
        settingsTitle: "Einstellungen",
        settingsSub: "Konfiguration der Systemschnittstellen und Erweiterungen.",
        langLabel: "Sprache / Language",
        idleStatus: "BEREIT",
        noTrack: "Kein Titel",
        // Sidebar Navigation Tabs
        nav_download: "Laden",
        nav_listen: "Hören",
        nav_settings: "Einstellungen",
        // Download Module (Matching your view perfectly)
        dl_title: "Mittelpunkt-Audio-Downloader",
        dl_sub: "Geben Sie einen Songtitel ein, um ihn direkt via Netzwerkintegration herunterzuladen.",
        dl_placeholder: "Z.B. Linkin Park - Numb",
        dl_btn: "Download",
        import_title: "Manueller Datei-Import",
        import_sub: "Füge vorhandene .opus Dateien von deinem PC direkt über das Interface zur App-Bibliothek hinzu.",
        import_btn: "Datei auswählen & importieren",
        // Plugin Manager Section
        pm_title: "Plugin-Verwaltung",
        pm_sub: "Aktive Core-Erweiterungen für modulares Streaming.",
        pm_status_active: "Aktiviert",
        pm_status_inactive: "Inaktiv",
        pm_btn_disable: "Deaktivieren",
        pm_btn_enable: "Aktivieren"
    },
    en: {
        appTitle: "Elysium",
        settingsTitle: "Settings",
        settingsSub: "Configuration of system interfaces and extensions.",
        langLabel: "Language / Sprache",
        idleStatus: "IDLE",
        noTrack: "No Track Loaded",
        // Sidebar Navigation Tabs
        nav_download: "Download",
        nav_listen: "Listen",
        nav_settings: "Settings",
        // Download Module
        dl_title: "Central Audio Downloader",
        dl_sub: "Enter a song title to download it directly via network integration.",
        dl_placeholder: "E.g., Linkin Park - Numb",
        dl_btn: "Download",
        import_title: "Manual File Import",
        import_sub: "Add existing .opus files from your PC directly to the app library via the interface.",
        import_btn: "Select & Import File",
        // Plugin Manager Section
        pm_title: "Plugin Manager",
        pm_sub: "Active core extensions for modular streaming capabilities.",
        pm_status_active: "Active",
        pm_status_inactive: "Inactive",
        pm_btn_disable: "Disable",
        pm_btn_enable: "Enable"
    }
};

// Global translation runtime injector
window.elysiumTranslate = function(lang) {
    localStorage.setItem('elysium_language', lang);
    document.documentElement.lang = lang;
    
    // Process standard text nodes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
};

const savedLanguage = localStorage.getItem('elysium_language') || 'de';

// --- HOT-SWAPPABLE PLUG-AND-PLAY PLUGIN MANAGER ---
class ElysiumPluginManager {
    constructor() {
        // Storage map for registered modular streaming plugins (YouTube, Spotify, etc.)
        this.plugins = new Map();
        
        // Seed initial mock configuration to give the UI life instantly
        this.plugins.set('youtube_core', { id: 'youtube_core', name: 'YouTube Audio Streamer', version: '2.1.0', active: true });
        this.plugins.set('spotify_bridge', { id: 'spotify_bridge', name: 'Spotify Web API Bridge', version: '1.0.4', active: false });
    }

    getPlugins() {
        return Array.from(this.plugins.values());
    }

    togglePlugin(id) {
        if (this.plugins.has(id)) {
            const plugin = this.plugins.get(id);
            plugin.active = !plugin.active;
            console.log(`[Plugin System] Toggle module "${id}" status to: ${plugin.active}`);
        }
    }
}
export const pluginManager = new ElysiumPluginManager();

// --- SETTINGS VIEW COMPONENT (WITH INTEGRATED PLUGIN MANAGER) ---
const settingsModule = {
    id: 'settings',
    label: 'Einstellungen',
    icon: ICON_SETTINGS,
    render() {
        const div = document.createElement('div');
        div.className = 'view-container animate-fade-in';
        
        const current = localStorage.getItem('elysium_language') || 'de';
        const activePlugins = pluginManager.getPlugins();
        
        // Build the composite layout containing i18n switches and the full Plugin Controller UI
        div.innerHTML = `
            <h2 class="view-title" data-i18n="settingsTitle">${translations[current].settingsTitle}</h2>
            <p style="color:var(--text-muted); margin-bottom: 24px;" data-i18n="settingsSub">${translations[current].settingsSub}</p>
            
            <div style="background: var(--bg-sidebar); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <label style="display: block; color: var(--text-main); font-weight: 600; margin-bottom: 10px; font-size:0.9rem;" data-i18n="langLabel">${translations[current].langLabel}</label>
                <select id="language-select" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; outline: none; cursor: pointer;">
                    <option value="de" ${current === 'de' ? 'selected' : ''}>Deutsch</option>
                    <option value="en" ${current === 'en' ? 'selected' : ''}>English</option>
                </select>
            </div>

            <h3 style="color: var(--text-main); font-size: 1.2rem; margin-bottom: 8px;" data-i18n="pm_title">${translations[current].pm_title}</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;" data-i18n="pm_sub">${translations[current].pm_sub}</p>
            
            <div id="plugin-list-container" style="display: flex; flex-direction: column; gap: 12px;">
                ${activePlugins.map(plugin => `
                    <div style="background: var(--bg-sidebar); border: 1px solid var(--border-subtle); padding: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${plugin.name} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">v${plugin.version}</span></div>
                            <div style="font-size: 0.8rem; color: ${plugin.active ? 'var(--accent-premium)' : 'var(--text-muted)'}; margin-top: 4px;" data-i18n="${plugin.active ? 'pm_status_active' : 'pm_status_inactive'}">
                                ${plugin.active ? translations[current].pm_status_active : translations[current].pm_status_inactive}
                            </div>
                        </div>
                        <button class="plugin-toggle-btn" data-plugin-id="${plugin.id}" style="background: ${plugin.active ? 'rgba(255,0,0,0.15)' : 'var(--accent-premium)'}; border: 1px solid ${plugin.active ? '#ff4a4a' : 'none'}; color: ${plugin.active ? '#ff4a4a' : 'white'}; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">
                            ${plugin.active ? translations[current].pm_btn_disable : translations[current].pm_btn_enable}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Attach interface event listeners to handle live mutations safely
        div.querySelector('#language-select').addEventListener('change', (e) => {
            window.elysiumTranslate(e.target.value);
        });

        div.querySelectorAll('.plugin-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.target.getAttribute('data-plugin-id');
                pluginManager.togglePlugin(pid);
                // Hot reload the active view state layout immediately
                const mountPoint = document.getElementById('content-mount-point');
                mountPoint.innerHTML = '';
                mountPoint.appendChild(settingsModule.render());
            });
        });

        return div;
    }
};

// --- SUBSYSTEM ROUTING & UI LIFECYCLE ---
moduleRegistry.onModuleSwitch((activeModule) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        mountPoint.appendChild(activeModule.render());
        window.elysiumTranslate(localStorage.getItem('elysium_language') || 'de');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.renderSidebarNavigation();
    
    // Dynamically patch sidebar translation capabilities right after generation
    const navSlots = document.getElementById('sidebar-navigation-slots');
    if (navSlots) {
        const tabs = navSlots.querySelectorAll('button, a, div.nav-item');
        if (tabs.length >= 3) {
            tabs[0].setAttribute('data-i18n', 'nav_download');
            tabs[1].setAttribute('data-i18n', 'nav_listen');
            tabs[2].setAttribute('data-i18n', 'nav_settings');
        }
    }

    injectGlobalPlayerBar();
    moduleRegistry.setActive('download');
    window.elysiumTranslate(savedLanguage);
});

// --- CORE AUDIO PLAYER CONTROLLER DASHBOARD ---
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
// FIXED CRITICAL SKIP ENGINE BUG: 
    // Dispatches a global event broadcast so active queue controllers can catch it,
    // then forces the native audio runtime to its limits as a hardware fallback.
    ffBtn.addEventListener('click', () => {
        console.log("[Player Core] Skip fast-forward triggered.");
        
        // Broadcast to modules (e.g. listenModule) to immediately advance playlist index
        window.dispatchEvent(new CustomEvent('elysium-skip-next'));

        if (audioEngine.audio) {
            audioEngine.audio.currentTime = audioEngine.audio.duration || 0;
            audioEngine.audio.dispatchEvent(new Event('ended'));
        }
    });
    const titleText = document.getElementById('player-title');
    const statusText = document.getElementById('player-status');
    const progressTrack = document.getElementById('player-progress-track');
    const progressFill = document.getElementById('player-progress-fill');
    const timeText = document.getElementById('player-time');

    playBtn.addEventListener('click', () => audioEngine.togglePause());

    // Jump back 10 seconds inside current track
    rewindBtn.addEventListener('click', () => {
        audioEngine.seek(Math.max(0, audioEngine.audio.currentTime - 10));
    });

    // FIXED CRITICAL SKIP ENGINE BUG: 
    // Dispatching native 'ended' event directly onto the engine audio core ensures all registered queue modules tracking playlist progression shift execution pipelines immediately.
    ffBtn.addEventListener('click', () => {
        if (audioEngine.audio) {
            audioEngine.audio.currentTime = audioEngine.audio.duration || 0;
            audioEngine.audio.dispatchEvent(new Event('ended'));
            console.log("[Player Core] Skip triggered -> advancend pipeline via native ended event context.");
        }
    });

    progressTrack.addEventListener('click', (e) => {
        const rect = progressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioEngine.seek(percentage * (audioEngine.audio.duration || 0));
    });

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