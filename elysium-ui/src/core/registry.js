// elysium-ui/src/core/registry.js
import { eventBus } from './eventBus.js';

/**
 * Core Architecture Registry. Manages slots, views, and plugin injection lifecycles.
 */
class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.slots = {
            sidebarNavigation: [],
            sidebarFooter: [],
            mainViews: new Map(),
            playerMeta: null,
            playerControls: null,
            playerUtilities: null
        };
        this.activeView = null;
    }

    /**
     * Registers and activates a plugin safely inside the core execution layer
     * @param {Object} plugin The plugin manifest and execution lifecycle
     */
    register(plugin) {
        // Self-healing check: Enforce structural minimum guidelines
        if (!plugin || !plugin.id || typeof plugin.init !== 'function') {
            console.error(`[Registry Error] Refused corrupted plugin architecture. Management reference ignored.`);
            return;
        }

        try {
            console.log(`[Elysium Engine] Activating module: ${plugin.name || plugin.id}`);
            this.plugins.set(plugin.id, plugin);
            plugin.init(this);
            eventBus.emit('plugin:activated', plugin.id);
        } catch (fault) {
            console.error(`[Registry Self-Healing] Active quarantine triggered for crashing plugin "${plugin.id}":`, fault);
        }
    }

    /**
     * Mounts a plugin view into a core UI navigation slot
     */
    registerView(viewId, sidebarLabelKey, renderFunction, position = 'navigation') {
        this.slots.mainViews.set(viewId, renderFunction);
        
        const targetSlot = position === 'footer' ? this.slots.sidebarFooter : this.slots.sidebarNavigation;
        targetSlot.push({ id: viewId, labelKey: sidebarLabelKey });
        
        eventBus.emit('registry:viewAdded', { viewId, position });
    }

    /**
     * Switches the active view in the MainContent container
     */
    switchView(viewId) {
        if (!this.slots.mainViews.has(viewId)) {
            console.warn(`[Registry] View target "${viewId}" not found. Navigation fallback triggered.`);
            return;
        }
        this.activeView = viewId;
        eventBus.emit('registry:viewSwitched', viewId);
    }
}

export const registry = new PluginRegistry();