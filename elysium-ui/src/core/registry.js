// elysium-ui/src/core/registry.js
// High-End Architecture Component: The Dynamic Plugin View Registry

class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.currentActiveId = null;
        this.onViewChangeCallback = null;
    }

    /**
     * Registers a new modular component into the application matrix
     */
    register(plugin) {
        if (!plugin.id || !plugin.label || !plugin.icon || typeof plugin.render !== 'function') {
            console.error('Core rejected invalid module structure:', plugin);
            return;
        }
        this.plugins.set(plugin.id, plugin);
    }

    /**
     * Connects the layout engine to catch view switching events
     */
    onViewChange(callback) {
        this.onViewChangeCallback = callback;
    }

    /**
     * Executes a clean state switch between modules
     */
    switchTo(id) {
        if (!this.plugins.has(id)) return;
        this.currentActiveId = id;
        
        if (this.onViewChangeCallback) {
            this.onViewChangeCallback(this.plugins.get(id));
        }
        this.renderSidebar();
    }

    /**
     * Compiles and draws the registered sidebar navigation points dynamically
     */
    renderSidebar() {
        const navContainer = document.getElementById('sidebar-navigation-slots');
        if (!navContainer) return;

        navContainer.innerHTML = '';

        this.plugins.forEach((plugin) => {
            const btn = document.createElement('button');
            // Clean dynamic active state class handling
            btn.className = `nav-btn ${this.currentActiveId === plugin.id ? 'active' : ''}`;
            
            btn.innerHTML = `
                <span class="nav-icon">${plugin.icon}</span>
                <span class="nav-label">${plugin.label}</span>
            `;

            btn.addEventListener('click', () => this.switchTo(plugin.id));
            navContainer.appendChild(btn);
        });
    }
}

export const registry = new PluginRegistry();