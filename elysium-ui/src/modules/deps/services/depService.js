// elysium-ui/src/modules/deps/services/depService.js
// Central dependency event listener — listens to backend dep-progress and dep-log-event.
// Updates global UI state (loader bar, status indicator) based on payload.

let unlistenProgress = null;
let unlistenLog = null;
let progressCallback = null;

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Deps', msg);
}

export function onDependencyProgress(callback) {
    progressCallback = callback;
}

export async function initDepListener() {
    if (!window.__TAURI_INTERNALS__) return;
    const { listen } = window.__TAURI_INTERNALS__;

    unlistenProgress = await listen('dep-progress', (event) => {
        const p = event.payload;
        log('INFO', `[${p.tool}] ${p.progress.toFixed(0)}% — ${p.status}`);
        if (progressCallback) progressCallback(p);
    });

    unlistenLog = await listen('dep-log-event', (event) => {
        const l = event.payload;
        log(l.level, `[deps] ${l.message}`);
    });
}

export function destroyDepListener() {
    if (unlistenProgress) { unlistenProgress(); unlistenProgress = null; }
    if (unlistenLog) { unlistenLog(); unlistenLog = null; }
}
