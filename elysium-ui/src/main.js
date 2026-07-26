// elysium-ui/src/main.js
// Application bootstrap and lifecycle orchestrator

import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/download/DownloadView.js';
import { listenModule } from './modules/listen/ListenView.js';
import { debugModule } from './modules/debug/DebugView.js';
import { settingsModule } from './modules/settings/SettingsView.js';
import { dependenciesModule } from './modules/dependencies/DependencyView.js';
import { PlayerBarModule } from './modules/player/PlayerBar.js';
import { checkForUpdate } from './core/services/updateService.js';
import { initDepListener } from './modules/deps/services/depService.js';
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
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.registerCoreModule(dependenciesModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.registerCoreModule(debugModule);

    new PlayerBarModule();
    moduleRegistry.setActive('download');

    listenForBackendLogs();
    initDepListener();

    checkForUpdate().then(info => {
        if (info) console.log(`[Update] New version available: ${info.version}`);
    });
});
