// elysium-ui/src/modules/debug/services/logService.js
// Log backlog management and entry formatting

const LOCALE_MAP = {
    de: 'de-DE',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
};

export const logBacklog = [];

export function appendEntry(container, { timestamp, level, module, message }) {
    const lang = localStorage.getItem('elysium_language') || 'de';
    const locale = LOCALE_MAP[lang] || 'en-US';
    const ts = timestamp || new Date().toLocaleTimeString(locale, { hour12: false });
    const entry = { timestamp: ts, level, module, message };
    logBacklog.push(entry);

    if (!container) return null;
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px; user-select:text;';
    const colors = { ERROR: '#ef4444', SUCCESS: '#22c55e', WARN: '#eab308', INFO: '#a1a1aa' };
    const c = colors[level] || '#a1a1aa';
    row.innerHTML = `<span style="color:#52525b; user-select:text;">[${ts}]</span> <span style="color:${c}; font-weight:bold; user-select:text;">[${level.padEnd(7)}]</span> <span style="color:var(--accent-premium); user-select:text;">[${module}]</span> <span style="color:#e4e4e7; user-select:text;">${message}</span>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return row;
}

export function formatAll() {
    return logBacklog.map(e => `[${e.timestamp}] [${e.level}] [${e.module}] ${e.message}`).join('\n');
}

export function clearLogs() {
    logBacklog.length = 0;
}
