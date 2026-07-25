// elysium-ui/src/api.js
// Tauri IPC bridge with fallback mock data for browser development

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'IPC', msg);
}

export async function invokeBackend(commandName, payload = {}) {
    try {
        if (window.__TAURI_INTERNALS__) {
            const { invoke } = window.__TAURI_INTERNALS__;
            log('INFO', `→ invoke("${commandName}") payload_keys=[${Object.keys(payload).join(', ')}]`);
            const result = await invoke(commandName, payload);
            log('INFO', `← invoke("${commandName}") resolved OK`);
            return result;
        } else {
            console.warn(`[IPC] Command "${commandName}" — running in browser fallback mode (no Tauri)`);
            return fallbackMockData(commandName, payload);
        }
    } catch (err) {
        log('ERROR', `invoke("${commandName}") failed: ${err.message || err}`);
        throw err;
    }
}

function fallbackMockData(commandName, payload) {
    if (commandName === 'scan_local_library') {
        return [{ id: "mock-1", title: "Elysium Premium Audio (Demo)", artist: "Local Opus Asset", duration: "04:20", file_path: "" }];
    }
    if (commandName === 'process_download_request') {
        return { id: "mock-dl", title: payload.query, artist: "Stream Cache Match", duration: "03:12", file_path: "" };
    }
    return null;
}
