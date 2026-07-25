// elysium-ui/src/modules/debugModule.js
// Real-time system log viewer and diagnostic terminal

const ICON_TERMINAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;

const logBacklog = [];
let activeTerminal = null;

window.addEventListener('elysium-system-log', (e) => {
    const { level, module, message } = e.detail;
    const ts = new Date().toLocaleTimeString('de-DE', { hour12: false });
    const entry = { timestamp: ts, level, module, message };
    logBacklog.push(entry);
    if (activeTerminal) appendEntry(activeTerminal, entry);
});

window.triggerElysiumLog = (level, module, message) => {
    window.dispatchEvent(new CustomEvent('elysium-system-log', { detail: { level, module, message } }));
};

function appendEntry(container, { timestamp, level, module, message }) {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px; user-select:text;';

    const colors = { ERROR: '#ef4444', SUCCESS: '#22c55e', WARN: '#eab308', INFO: '#a1a1aa' };
    const c = colors[level] || '#a1a1aa';

    row.innerHTML = `<span style="color:#52525b; user-select:text;">[${timestamp}]</span> <span style="color:${c}; font-weight:bold; user-select:text;">[${level.padEnd(7)}]</span> <span style="color:var(--accent-premium); user-select:text;">[${module}]</span> <span style="color:#e4e4e7; user-select:text;">${message}</span>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
}

function formatAll() {
    return logBacklog.map(e => `[${e.timestamp}] [${e.level}] [${e.module}] ${e.message}`).join('\n');
}

export const debugModule = {
    id: 'debug',
    label: 'System Logs',
    icon: ICON_TERMINAL,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        vp.style.cssText = 'display:flex; flex-direction:column; height:calc(100vh - 140px);';

        vp.innerHTML = `
            <div style="margin-bottom:16px;">
                <h2 class="view-title" style="margin:0;" data-i18n="log_title">Elysium Engine Stream Monitor</h2>
                <p style="color:var(--text-muted); font-size:0.85rem; margin:4px 0 0 0;" data-i18n="log_sub">Echtzeit-Diagnose der Frontend-Brücke und Pipeline-Events.</p>
            </div>
            <div id="dev-terminal-screen" style="flex:1; background:#09090b; border:1px solid var(--border-subtle); border-radius:6px; font-family:'Courier New',Courier,monospace; font-size:0.8rem; padding:16px; overflow-y:auto; color:#a1a1aa; line-height:1.6; box-shadow:inset 0 2px 8px rgba(0,0,0,0.8); user-select:text !important;"></div>
            <div style="margin-top:12px; display:flex; gap:8px;">
                <button id="copy-terminal-btn" style="background:var(--accent-premium); border:none; color:white; font-size:0.8rem; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600; transition:background 0.2s;" data-i18n="log_copy">Logs kopieren</button>
                <button id="clear-terminal-btn" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); color:var(--text-main); font-size:0.8rem; padding:8px 12px; border-radius:4px; cursor:pointer;" data-i18n="log_clear">Konsole leeren</button>
            </div>
        `;

        activeTerminal = vp.querySelector('#dev-terminal-screen');

        if (logBacklog.length === 0) {
            activeTerminal.innerHTML = `<div style="color:#52525b;">[System] Logger Engine online. Awaiting system triggers...</div>`;
        } else {
            logBacklog.forEach(e => appendEntry(activeTerminal, e));
        }

        this.wireEvents(vp);
        return vp;
    },

    wireEvents(vp) {
        vp.querySelector('#clear-terminal-btn').addEventListener('click', () => {
            logBacklog.length = 0;
            if (activeTerminal) activeTerminal.innerHTML = `<div style="color:#52525b;">[System] Terminal cleared.</div>`;
        });

        vp.querySelector('#copy-terminal-btn').addEventListener('click', function () {
            if (logBacklog.length === 0) return;
            navigator.clipboard.writeText(formatAll()).then(() => {
                const prev = this.textContent;
                this.textContent = 'Kopiert! ✓';
                this.style.background = '#22c55e';
                setTimeout(() => { this.textContent = prev; this.style.background = 'var(--accent-premium)'; }, 1500);
            }).catch(err => console.error('Clipboard failed:', err));
        });
    }
};
