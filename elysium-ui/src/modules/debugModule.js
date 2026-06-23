// elysium-ui/src/modules/debugModule.js
const ICON_TERMINAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;

// Persistent runtime memory cache for logging events
const logBacklog = [];
let activeTerminalContainer = null;

// INSTANT HOOK: Attach structural event listener immediately on file import phase
window.addEventListener('elysium-system-log', (e) => {
    const { level, module, message } = e.detail;
    const timestamp = new Date().toLocaleTimeString();
    
    logBacklog.push({ timestamp, level, module, message });
    
    // Live injection if the developer currently actively inspects the terminal view
    if (activeTerminalContainer) {
        appendLogToDOM(activeTerminalContainer, timestamp, level, module, message);
    }
});

// Global short-proxy executor
window.triggerElysiumLog = (level, module, message) => {
    window.dispatchEvent(new CustomEvent('elysium-system-log', {
        detail: { level, module, message }
    }));
};

function appendLogToDOM(container, timestamp, level, module, message) {
    const logRow = document.createElement('div');
    logRow.style.marginBottom = '6px';
    logRow.style.userSelect = 'text'; // CRITICAL: Explicitly bypass global application copy-locks
    
    let levelColor = '#a1a1aa';
    if (level === 'ERROR') levelColor = '#ef4444';
    if (level === 'SUCCESS') levelColor = '#22c55e';
    if (level === 'WARN') levelColor = '#eab308';

    logRow.innerHTML = `
        <span style="color: #52525b; user-select: text;">[${timestamp}]</span> 
        <span style="color: ${levelColor}; font-weight: bold; user-select: text;">[${level}]</span> 
        <span style="color: var(--accent-premium); user-select: text;">[${module}]</span> 
        <span style="color: #e4e4e7; user-select: text;">${message}</span>
    `;
    container.appendChild(logRow);
    container.scrollTop = container.scrollHeight;
}

export const debugModule = {
    id: 'debug',
    label: 'System Logs',
    icon: ICON_TERMINAL,

    render() {
        const viewport = document.createElement('div');
        viewport.className = 'view-container animate-fade-in';
        viewport.style.display = 'flex';
        viewport.style.flexDirection = 'column';
        viewport.style.height = 'calc(100vh - 140px)';

        viewport.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h2 class="view-title" style="margin: 0;">Elysium Engine Stream Monitor</h2>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 4px 0 0 0;">Echtzeit-Diagnose der Frontend-Brücke und Pipeline-Events.</p>
            </div>
            
            <div id="dev-terminal-screen" style="flex: 1; background: #09090b; border: 1px solid var(--border-subtle); border-radius: 6px; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; padding: 16px; overflow-y: auto; color: #a1a1aa; line-height: 1.5; box-shadow: inset 0 2px 8px rgba(0,0,0,0.8); user-select: text !important;">
            </div>

            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button id="copy-terminal-btn" style="background: var(--accent-premium); border: none; color: white; font-size: 0.8rem; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; transition: background 0.2s;">Logs kopieren</button>
                <button id="clear-terminal-btn" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); color: var(--text-main); font-size: 0.8rem; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Konsole leeren</button>
            </div>
        `;

        activeTerminalContainer = viewport.querySelector('#dev-terminal-screen');
        
        // Rehydrate view screen from backlog history pool
        if (logBacklog.length === 0) {
            activeTerminalContainer.innerHTML = `<div style="color: #52525b;">[System] Logger Engine online. Awaiting system triggers...</div>`;
        } else {
            logBacklog.forEach(log => {
                appendLogToDOM(activeTerminalContainer, log.timestamp, log.level, log.module, log.message);
            });
        }

        this.wireEvents(viewport);
        return viewport;
    },

    wireEvents(viewport) {
        const clearBtn = viewport.querySelector('#clear-terminal-btn');
        const copyBtn = viewport.querySelector('#copy-terminal-btn');

        clearBtn.addEventListener('click', () => {
            logBacklog.length = 0;
            if (activeTerminalContainer) {
                activeTerminalContainer.innerHTML = `<div style="color: #52525b;">[System] Terminal cleared.</div>`;
            }
        });

        copyBtn.addEventListener('click', () => {
            if (logBacklog.length === 0) return;
            
            // Format array data to clean clipboard string structure
            const textToCopy = logBacklog.map(log => `[${log.timestamp}] [${log.level}] [${log.module}] ${log.message}`).join('\n');
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const prevText = copyBtn.textContent;
                copyBtn.textContent = 'Kopiert! ✓';
                copyBtn.style.background = '#22c55e';
                setTimeout(() => {
                    copyBtn.textContent = prevText;
                    copyBtn.style.background = 'var(--accent-premium)';
                }, 1500);
            }).catch(err => {
                console.error('Clipboard injection failed: ', err);
            });
        });
    }
};