/**
 * Architecture registry managing hot-swappable music sourcing plugins
 */
class PluginManager {
    constructor() {
        // Active streaming providers stored at runtime
        this.plugins = new Map();
    }

    /**
     * Registers a modular streaming platform into the unified pipeline
     * @param {Object} pluginInstance - Instance conforming to Elysium specifications
     */
    register(pluginInstance) {
        if (!pluginInstance.id || typeof pluginInstance.search !== 'function') {
            throw new Error(`[Plugin System] Invalid module composition rejected: ${pluginInstance.id}`);
        }
        this.plugins.set(pluginInstance.id, pluginInstance);
        console.log(`[Plugin System] Successfully mounted provider: ${pluginInstance.name} [v${pluginInstance.version}]`);
    }

    /**
     * Unmounts a provider instantly disabling its discovery footprint
     * @param {string} pluginId - Unique string identifier
     */
    unregister(pluginId) {
        if (this.plugins.has(pluginId)) {
            this.plugins.delete(pluginId);
            console.log(`[Plugin System] Unmounted provider: ${pluginId}`);
        }
    }

    /**
     * Dispatches query across all registered modules simultaneously
     * @param {string} query - Search string entered by user
     * @returns {Promise<Array>} Aggregated cross-platform normalized results
     */
    async aggregateSearch(query) {
        const searchPromises = Array.from(this.plugins.values()).map(async (plugin) => {
            try {
                return await plugin.search(query);
            } catch (err) {
                console.error(`[Plugin Error] Provider "${plugin.id}" failed executing search:`, err);
                return [];
            }
        });

        const resultsArray = await Promise.all(searchPromises);
        // Flatten nested array structures into a single unified dashboard view
        return resultsArray.flat();
    }
}

export const pluginManager = new PluginManager();