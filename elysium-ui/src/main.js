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
import { PlayerBarModule } from './modules/player/PlayerBar.js';
import { checkForUpdate } from './core/services/updateService.js';
import { initDepListener } from './modules/deps/services/depService.js';
import { playlistState } from './components/playlists/services/playlistState.js';
import { renderPlaylistSidebar } from './components/playlists/PlaylistList.js';
import { initPlaylistViewListener } from './components/playlists/PlaylistView.js';
import { initializeLanguage } from './config/language/languageDetector.js';
import './config/translations.js';

moduleRegistry.onModuleSwitch((activeModule) => {
    const mount = document.getElementById('content-mount-point');
    if (mount) {
        mount.innerHTML = '';
        mount.appendChild(activeModule.render());
    }
});

function listenForBackendLogs() {
    if (window.__TAURI_INTERNALS__) {
        const { listen } = window.__TAURI_INTERNALS__;
        listen('elysium-log', (event) => {
            if (window.triggerElysiumLog && event.payload) {
                window.triggerElysiumLog('INFO', 'Backend', String(event.payload));
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();

    moduleRegistry.registerCoreModule(searchModule);
    moduleRegistry.registerCoreModule(playlistOverviewModule);
    moduleRegistry.registerCoreModule(dependenciesModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.registerCoreModule(debugModule);

    new PlayerBarModule();
    metadataRegistry.register(youtubeMetadataProvider);
    moduleRegistry.setActive('search');

    listenForBackendLogs();
    initDepListener();
    initPlaylistViewListener();

    async function loadPlaylists(retryCount = 0) {
        const MAX_RETRIES = 3;
        const container = document.getElementById('sidebar-playlist-slots');

        try {
            // Versuche den State aus dem Storage/Tauri Backend zu laden
            await playlistState.load();
            
            // Sofort im UI rendern (egal ob 0 oder 10 Playlists da sind)
            renderPlaylistSidebar(container);
        } catch (err) {
            console.error(`[Init] Playlist load error (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, err);
            
            if (retryCount < MAX_RETRIES) {
                // Falls das Storage-Plugin beim Start noch kurz gebraucht hat: Retry nach 500ms
                setTimeout(() => loadPlaylists(retryCount + 1), 500);
            } else {
                // Bei echtem fehlerhaftem Abbruch leeren State anzeigen
                renderPlaylistSidebar(container);
            }
        }
    }

    loadPlaylists(0);

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