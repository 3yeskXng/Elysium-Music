// elysium-ui/src/modules/dependencies/services/depProgressService.js
// Progress event listener for dependency installation/update events from Rust backend
// Listens to "dep-progress" events and updates the status box in real-time

import { setStatusBox } from './depStatusService.js';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

export async function listenProgress(toolName, statusBox, onDone = null) {
    if (!window.__TAURI_INTERNALS__) return () => {};
    const { listen } = window.__TAURI_INTERNALS__;
    const unlisten = await listen('dep-progress', (event) => {
        const p = event.payload;
        if (p.tool !== toolName && p.tool !== 'all') return;
        log('INFO', `[${p.tool}] ${p.progress.toFixed(0)}% — ${p.status}`);

        if (p.progress >= 100) {
            setStatusBox(statusBox, 'rgba(34,197,94,0.1)', '#22c55e', p.status);
            if (onDone) onDone();
        } else if (p.status.toLowerCase().includes('failed') || p.status.toLowerCase().includes('error')) {
            setStatusBox(statusBox, 'rgba(239,68,68,0.1)', '#ef4444', p.status);
        } else {
            setStatusBox(statusBox, 'rgba(138,92,246,0.1)', 'var(--accent-premium)', p.status);
        }
    });
    return unlisten;
}

export function safeUnlisten(unlistenFn) {
    if (unlistenFn) {
        unlistenFn();
        return null;
    }
    return null;
}
