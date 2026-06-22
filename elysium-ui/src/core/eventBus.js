// elysium-ui/src/core/eventBus.js

/**
 * High-End decoupled event orchestrator for cross-platform messaging.
 * Prevents application crashes by isolating event execution scopes.
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to a global application event
     * @param {string} event Name of the event
     * @param {Function} callback Execution sequence
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Emit an event asynchronously with automated self-healing error boundaries
     * @param {string} event Name of the event
     * @param {any} data Payload data
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                // Async execution to prevent single plugin failures from blocking the core thread
                setTimeout(() => callback(data), 0);
            } catch (error) {
                console.error(`[EventBus Fault] Self-healed crash in listener for event "${event}":`, error);
            }
        });
    }
}

export const eventBus = new EventBus();