// elysium-ui/src/main.js
// Application bootstrap and lifecycle orchestrator

import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/downloadModule.js';
import { listenModule } from './modules/listenModule.js';
import { debugModule } from './modules/debugModule.js';
import { settingsModule } from './modules/settingsModule.js';
import { PlayerBarModule } from './modules/PlayerBar.js';
import './config/translations.js';

moduleRegistry.onModuleSwitch((activeModule) => {
    const mount = document.getElementById('content-mount-point');
    if (mount) {
        mount.innerHTML = '';
        mount.appendChild(activeModule.render());
    }
});

document.addEventListener('DOMContentLoaded', () => {
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.registerCoreModule(debugModule);

    new PlayerBarModule();
    moduleRegistry.setActive('download');
});
