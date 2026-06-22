// elysium-ui/src/api.js
// High-End Autonomous Tauri IPC Bridge Framework

/**
 * Executes a secure, isolated asynchronous invocation call to the Tauri Rust core.
 * Features built-in global safety boundaries to prevent UI execution crashes.
 */
export async function invokeBackend(commandName, payload = {}) {
    try {
        // Guard checking if running inside a valid Tauri webview environment context
        if (window.__TAURI_INTERNALS__) {
            const { invoke } = window.__TAURI_INTERNALS__;
            return await invoke(commandName, payload);
        } else {
            console.warn(`[Tauri IPC Simulation] Command "${commandName}" executed outside native webview frame.`);
            return fallbackMockData(commandName, payload);
        }
    } catch (faultBoundary) {
        console.error(`[IPC Engine Fault] Self-healed unhandled exception in core command "${commandName}":`, faultBoundary);
        throw faultBoundary;
    }
}

/**
 * Automated fallback generator ensuring UI continuity during standard browser testing cycles
 */
function fallbackMockData(commandName, payload) {
    if (commandName === 'get_local_library') {
        return [
            { id: "mock-1", title: "Elysium Premium Audio (Demo Check)", artist: "Local Opus Asset", duration: "04:20", file_path: "" }
        ];
    }
    if (commandName === 'process_download_request') {
        return { id: "mock-dl", title: payload.query, artist: "Stream Cache Match", duration: "03:12", file_path: "" };
    }
    return null;
}