// elysium-ui/src/core/moduleRegistry.js
// High-End Architecture: Static Core Module Registry

class ModuleRegistry {
    constructor() {
        this.modules = new Map();
        this.activeModuleId = null;
        this.onViewChangeCallback = null;
    }

    /**
     * Statically registers a compiled core module into the system matrix
     * @param {Object} coreModule Guarded structural module interface
     */
    registerCoreModule(coreModule) {
        if (!coreModule.id || !coreModule.label || !coreModule.icon || typeof coreModule.render !== 'function') {
            console.error(`[Module System Fault] Rejected invalid structural core component.`);
            return;
        }
        this.modules.set(coreModule.id, coreModule);
    }

    /**
     * Binds the core layout viewports to module switching sequences
     */
    onModuleSwitch(callback) {
        this.onViewChangeCallback = callback;
    }

    /**
     * Switches safely between core views
     * @param {string} id Unique target module identity
     */
    setActive(id) {
        if (!this.modules.has(id)) {
            console.warn(`[Module Engine] Target scope "${id}" does not exist in build matrix.`);
            return;
        }
        this.activeModuleId = id;
        
        if (this.onViewChangeCallback) {
            this.onViewChangeCallback(this.modules.get(id));
        }
        this.renderSidebarNavigation();
    }

    /**
     * Computes and renders the sidebar structural slots
     */
    renderSidebarNavigation() {
        const navContainer = document.getElementById('sidebar-navigation-slots');
        if (!navContainer) return;

        navContainer.innerHTML = '';

        this.modules.forEach((mod) => {
            const btn = document.createElement('button');
            btn.className = `nav-btn ${this.activeModuleId === mod.id ? 'active' : ''}`;
            
            btn.innerHTML = `
                <span class="nav-icon">${mod.icon}</span>
                <span class="nav-label">${mod.label}</span>
            `;

            btn.addEventListener('click', () => this.setActive(mod.id));
            navContainer.appendChild(btn);
        });
    }
}

export const moduleRegistry = new ModuleRegistry();