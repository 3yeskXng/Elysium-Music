// elysium-ui/src/core/moduleRegistry.js
// Central module registry and sidebar navigation controller

import { t } from '../utils/translate.js';

class ModuleRegistry {
    constructor() {
        this.modules = new Map();
        this.activeModuleId = null;
        this.onViewChangeCallback = null;
    }

    registerCoreModule(coreModule) {
        if (!coreModule.id || !coreModule.label || !coreModule.icon || typeof coreModule.render !== 'function') {
            console.error('[Module System] Rejected invalid module:', coreModule);
            return;
        }
        this.modules.set(coreModule.id, coreModule);
    }

    onModuleSwitch(callback) {
        this.onViewChangeCallback = callback;
    }

    setActive(id) {
        if (!this.modules.has(id)) {
            console.warn(`[Module Engine] Unknown module "${id}".`);
            return;
        }
        this.activeModuleId = id;
        this.renderSidebarNavigation();
        if (this.onViewChangeCallback) {
            this.onViewChangeCallback(this.modules.get(id));
        }
        this.applyTranslations();
    }

    renderSidebarNavigation() {
        const nav = document.getElementById('sidebar-navigation-slots');
        if (!nav) return;

        nav.innerHTML = '';
        this.modules.forEach((mod) => {
            const btn = document.createElement('button');
            btn.className = `nav-btn ${this.activeModuleId === mod.id ? 'active' : ''}`;
            const label = t(mod.label);

            btn.innerHTML = `
                <span class="nav-icon">${mod.icon}</span>
                <span class="nav-label">${label}</span>
            `;

            btn.addEventListener('click', () => this.setActive(mod.id));
            nav.appendChild(btn);
        });
    }

    applyTranslations() {
        const lang = localStorage.getItem('elysium_language') || 'de';
        if (window.elysiumTranslate) window.elysiumTranslate(lang);
    }
}

export const moduleRegistry = new ModuleRegistry();
