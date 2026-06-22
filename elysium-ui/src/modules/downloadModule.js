// elysium-ui/src/modules/downloadModule.js
import { invokeBackend } from '../api.js';

const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

export const downloadModule = {
    id: 'download',
    label: 'Laden',
    icon: ICON_DOWNLOAD,
    
    render() {
        const viewport = document.createElement('div');
        viewport.className = 'view-container animate-fade-in';
        
        viewport.innerHTML = `
            <input type="text" class="search-input" placeholder="Gebe hier URL, Songname, Videoname oder Dateiname des Liedes ein...">
            <div class="dashboard-preview-text">Zuletzt Heruntergeladen</div>
            <div class="covers-grid-placeholder" id="download-output-terminal" style="margin-top:20px; color:var(--text-muted); font-family: monospace; font-size:0.85rem; line-height:1.6;">
                Status: Waiting for active stream requests...
            </div>
        `;
        
        const input = viewport.querySelector('.search-input');
        const outputConsole = viewport.querySelector('#download-output-terminal');

        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                const userQuery = input.value.trim();
                input.value = ''; // Clean buffer immediately
                
                outputConsole.innerHTML = `<span style="color:var(--accent-premium);">[Elysium Core] Processing stream intercept pipeline for target: "${userQuery}"...</span>`;
                
                try {
                    // Fire native backend action execution thread
                    const trackMetadata = await invokeBackend('process_download_request', { query: userQuery });
                    
                    outputConsole.innerHTML = `
                        <span style="color: #10b981;">✅ High-fidelity caching complete! Loaded tracking reference.</span><br>
                        <span style="color: var(--text-muted);">Title: ${trackMetadata.title} | Format: Opus Audio Codec Container</span>
                    `;
                } catch (error) {
                    outputConsole.innerHTML = `<span style="color: #ef4444;">❌ Execution Fault: ${error}</span>`;
                }
            }
        });

        return viewport;
    }
};