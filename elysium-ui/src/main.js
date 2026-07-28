// elysium-ui/src/main.js
// Application bootstrap and lifecycle orchestrator

import { moduleRegistry } from './core/moduleRegistry.js';
import { searchModule } from './modules/search/SearchView.js';
import { debugModule } from './modules/debug/DebugView.js';
import { settingsModule } from './modules/settings/SettingsView.js';
import { dependenciesModule } from './modules/dependencies/DependencyView.js';
import { playlistOverviewModule } from './modules/playlists/PlaylistOverviewView.js';
import { metadataRegistry } from './core/metadata/metadataRegistry.js';
import { youtubeMetadataProvider } from './core/metadata/providers/youtubeMetadataProvider.js';
import { initPlayerBar } from './components/playerbar/PlayerBar.js';
import { checkForUpdate } from './core/services/updateService.js';
import { initDepListener } from './modules/deps/services/depService.js';
import { playlistState } from './components/playlists/services/playlistState';
import { renderPlaylistSidebar } from './components/playlists/PlaylistList';
import { initPlaylistViewListener } from './components/playlists/PlaylistView';
import { initializeLanguage } from './config/language/languageDetector.js';
import { initToastManager } from './components/popup/ToastManager.ts';
import './config/translations.js';

moduleRegistry.onModuleSwitch((activeModule) => {
    const mount = document.getElementById('content-mount-point');
    if (mount) {
        mount.innerHTML = '';
        mount.appendChild(activeModule.render());
    }
});

function listenForBackendLogs() {
    try {
        const internals = window.__TAURI_INTERNALS__;
        const listen = internals && typeof internals.listen === 'function'
            ? internals.listen
            : window.__TAURI__?.event?.listen;
        if (typeof listen !== 'function') return;
        listen('elysium-log', (event) => {
            if (window.triggerElysiumLog && event.payload) {
                window.triggerElysiumLog('INFO', 'Backend', String(event.payload));
            }
        });
    } catch (_) { /* Tauri event API not available in this build */ }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();
    initToastManager();

    moduleRegistry.registerCoreModule(searchModule);
    moduleRegistry.registerCoreModule(playlistOverviewModule);
    moduleRegistry.registerCoreModule(dependenciesModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.registerCoreModule(debugModule);

    initPlayerBar();
    metadataRegistry.register(youtubeMetadataProvider);
    moduleRegistry.setActive('search');

    listenForBackendLogs();
    initDepListener();
    initPlaylistViewListener();

    playlistState.load();

    window.addEventListener('elysium-playlists-loaded', () => {
        renderPlaylistSidebar(document.getElementById('sidebar-playlist-slots'));
    });

    checkForUpdate().then(info => {
        if (info) console.log(`[Update] New version available: ${info.version}`);
    });

    window.addEventListener('elysium-playlist-created', () => {
        renderPlaylistSidebar(document.getElementById('sidebar-playlist-slots'));
    });

    window.addEventListener('elysium-close-playlist', () => {
        moduleRegistry.setActive('playlists');
    });
});
