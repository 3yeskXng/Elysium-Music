// elysium-ui/src/modules/dependencies/services/depProgressService.js
// Progress event listener for dependency installation/update events from Rust backend
// Listens to "dep-progress" events and updates the status box in real-time

import { setStatusBox } from './depStatusService.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

/**
 * Listen to Tauri dep-progress events for a specific tool.
 * Returns an unlisten function to stop listening.
 * @param {string} toolName - The tool to listen for ('yt-dlp', 'ffmpeg', 'ffprobe')
 * @param {HTMLElement} statusBox - The status display element
 * @param {Function|null} onDone - Callback when step is 'done' or 'skip'
 * @returns {Function} Unlisten function
 */
export function listenProgress(toolName, statusBox, onDone = null) {
    if (!window.__TAURI_INTERNALS__) return () => {};
    const { listen } = window.__TAURI_INTERNALS__;
    const unlisten = listen('dep-progress', (event) => {
        const p = event.payload;
        if (p.tool !== toolName) return;
        log('INFO', `[${p.tool}] ${p.step}: ${p.message}`);
        if (p.step === 'done' || p.step === 'skip') {
            setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e', p.message);
            if (onDone) onDone();
        } else if (p.step === 'error') {
            setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444', p.message);
        } else {
            setStatusBox(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', p.message);
        }
    });
    return unlisten;
}

/**
 * Safely unlisten and reset the reference.
 * @param {Function|null} unlistenFn - Current unlisten function
 * @returns {null}
 */
export function safeUnlisten(unlistenFn) {
    if (unlistenFn) {
        unlistenFn();
        return null;
    }
    return null;
}
