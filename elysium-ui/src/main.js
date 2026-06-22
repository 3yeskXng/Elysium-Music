// elysium-ui/src/main.js
// Elysium Premium Core Initialization Layer (Bootloader)

import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/downloadModule.js';
import { listenModule } from './modules/listenModule.js';

const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

// Wire the UI mount viewport up to the module engine
moduleRegistry.onModuleSwitch((activeModule) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        mountPoint.appendChild(activeModule.render());
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Bake fixed core modules into the build matrix
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    
    // 2. Compute primary user interface structures
    moduleRegistry.renderSidebarNavigation();
    
    // 3. Mount static system footer actions (Settings)
    const footerSlots = document.getElementById('sidebar-footer-slots');
    if (footerSlots) {
        footerSlots.innerHTML = `
            <button class="nav-btn" id="settings-trigger">
                <span class="nav-icon">${ICON_SETTINGS}</span>
                <span class="nav-label">Settings</span>
            </button>
        `;
        document.getElementById('settings-trigger').addEventListener('click', () => {
            console.log('[System] Settings scope triggered.');
        });
    }

    // 4. Force standard boot target viewport
    moduleRegistry.setActive('download');
});