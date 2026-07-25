// src/main.js
import { moduleRegistry } from './core/moduleRegistry.js';
import { downloadModule } from './modules/downloadModule.js';
import { listenModule } from './modules/listenModule.js';
import { debugModule } from './modules/debugModule.js';
import { settingsModule } from './modules/settingsModule.js';
import { PlayerBarModule } from "./modules/PlayerBar.js";
import './config/translations.js'; // Initialisiert die globale Übersetzungs-Runtime

const savedLanguage = localStorage.getItem('elysium_language') || 'de';

// Subsystem Routing & UI Lifecycle Management
moduleRegistry.onModuleSwitch((activeModule) => {
    const mountPoint = document.getElementById('content-mount-point');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        mountPoint.appendChild(activeModule.render());
        window.elysiumTranslate(localStorage.getItem('elysium_language') || 'de');
    }
});

// App Bootstrap Sequenz nach DOM-Bereitschaft
document.addEventListener('DOMContentLoaded', () => {
    // 1. Module registrieren
    moduleRegistry.registerCoreModule(downloadModule);
    moduleRegistry.registerCoreModule(listenModule);
    moduleRegistry.registerCoreModule(settingsModule);
    moduleRegistry.registerCoreModule(debugModule);
    
    // 2. Navigation rendern
    moduleRegistry.renderSidebarNavigation();

    // 3. Globalen Player-Core wecken
    new PlayerBarModule();

    // 4. Standard-Ansicht starten
    moduleRegistry.setActive('download');
    window.elysiumTranslate(savedLanguage);
});