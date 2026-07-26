// elysium-ui/src/modules/debug/DebugView.js
// Real-time system log viewer — terminal UI and event wiring

import { ICON_TERMINAL } from '../../config/icons.js';
import { t } from '../../utils/translate.js';
import { logBacklog, appendEntry, formatAll, clearLogs } from './services/logService.js';

let activeTerminal = null;

export const debugModule = {
    id: 'debug',
    label: 'nav_debug',
    icon: ICON_TERMINAL,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        vp.style.cssText = 'display:flex; flex-direction:column; height:calc(100vh - 140px);';

        vp.innerHTML = `
            <div style="margin-bottom:16px;">
                <h2 class="view-title" style="margin:0;" data-i18n="log_title">${t('log_title')}</h2>
                <p style="color:var(--text-muted); font-size:0.85rem; margin:4px 0 0 0;" data-i18n="log_sub">${t('log_sub')}</p>
            </div>
            <div id="dev-terminal-screen" style="flex:1; background:#09090b; border:1px solid var(--border-subtle); border-radius:6px; font-family:'Courier New',Courier,monospace; font-size:0.8rem; padding:16px; overflow-y:auto; color:#a1a1aa; line-height:1.6; box-shadow:inset 0 2px 8px rgba(0,0,0,0.8); user-select:text !important;"></div>
            <div style="margin-top:12px; display:flex; gap:8px;">
                <button id="copy-terminal-btn" style="background:var(--accent-premium); border:none; color:white; font-size:0.8rem; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600; transition:background 0.2s;" data-i18n="log_copy">${t('log_copy')}</button>
                <button id="clear-terminal-btn" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); color:var(--text-main); font-size:0.8rem; padding:8px 12px; border-radius:4px; cursor:pointer;" data-i18n="log_clear">${t('log_clear')}</button>
            </div>
        `;

        activeTerminal = vp.querySelector('#dev-terminal-screen');
        if (logBacklog.length === 0) {
            activeTerminal.innerHTML = `<div style="color:#52525b;">${t('log_system_online')}</div>`;
        } else {
            logBacklog.forEach(e => appendEntry(activeTerminal, e));
        }

        this.wireEvents(vp);
        return vp;
    },

    wireEvents(vp) {
        vp.querySelector('#clear-terminal-btn').addEventListener('click', () => {
            clearLogs();
            if (activeTerminal) activeTerminal.innerHTML = `<div style="color:#52525b;">${t('log_terminal_cleared')}</div>`;
        });

        vp.querySelector('#copy-terminal-btn').addEventListener('click', function () {
            if (logBacklog.length === 0) return;
            navigator.clipboard.writeText(formatAll()).then(() => {
                const prev = this.textContent;
                this.textContent = t('log_copied');
                this.style.background = '#22c55e';
                setTimeout(() => { this.textContent = prev; this.style.background = 'var(--accent-premium)'; }, 1500);
            }).catch(err => console.error('Clipboard failed:', err));
        });
    }
};

window.addEventListener('elysium-system-log', (e) => {
    const entry = appendEntry(null, e.detail);
    if (activeTerminal && entry) activeTerminal.appendChild(entry);
});

window.triggerElysiumLog = (level, module, message) => {
    window.dispatchEvent(new CustomEvent('elysium-system-log', { detail: { level, module, message } }));
};
