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
            <h2 class="view-title" data-i18n="dl_title">Mittelpunkt-Audio-Downloader</h2>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;" data-i18n="dl_sub">Geben Sie einen Songtitel ein, um ihn direkt via Netzwerkintegration herunterzuladen.</p>
            
            <div style="display: flex; gap: 12px; margin-bottom: 32px;">
                <input type="text" id="download-input" data-i18n="dl_placeholder" placeholder="Z.B. Linkin Park - Numb" style="flex: 1; padding: 12px 16px; background: var(--bg-sidebar); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-main); font-size: 0.95rem; outline: none;">
                <button id="download-trigger" data-i18n="dl_btn" style="background: var(--accent-premium); border: none; color: white; font-weight: 600; padding: 0 24px; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">Download</button>
            </div>

            <div style="padding: 24px; border: 1px solid var(--border-subtle); background: var(--bg-sidebar); border-radius: 8px; margin-bottom: 24px;">
                <h3 style="font-size: 1rem; margin-bottom: 8px; color: var(--text-main); font-weight: 600;" data-i18n="import_title">Manueller Datei-Import</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;" data-i18n="import_sub">Füge vorhandene .opus Dateien von deinem PC direkt über das Interface zur App-Bibliothek hinzu.</p>
                <button id="import-trigger" data-i18n="import_btn" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); color: var(--text-main); font-weight: 600; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">Datei auswählen & importieren</button>
                <input type="file" id="hidden-file-input" accept=".opus" style="display: none;">
            </div>

            <div id="download-status-box" style="display: none; padding: 16px; border-radius: 6px; font-size: 0.9rem; line-height: 1.4;"></div>
        `;

        this.wireEvents(viewport);
        return viewport;
    },

    wireEvents(viewport) {
        const input = viewport.querySelector('#download-input');
        const btn = viewport.querySelector('#download-trigger');
        const statusBox = viewport.querySelector('#download-status-box');
        const importBtn = viewport.querySelector('#import-trigger');
        const fileInput = viewport.querySelector('#hidden-file-input');

        const getLang = () => localStorage.getItem('elysium_language') || 'de';

        // Local Import File Handling
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const currentLang = getLang();
            statusBox.style.display = 'block';
            statusBox.style.background = 'rgba(138, 92, 246, 0.1)';
            statusBox.style.color = 'var(--accent-premium)';
            statusBox.textContent = currentLang === 'de' ? `Kopiere "${file.name}"...` : `Copying "${file.name}"...`;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const bytes = Array.from(new Uint8Array(arrayBuffer));
                const cleanName = file.name.replace('.opus', '');
                
                await invokeBackend('save_track', { title: cleanName, bytes });
                
                statusBox.style.background = 'rgba(34, 197, 94, 0.1)';
                statusBox.style.color = '#22c55e';
                statusBox.textContent = currentLang === 'de' ? `Erfolgreich kopiert!` : `Successfully imported!`;
            } catch (err) {
                statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
                statusBox.style.color = '#ef4444';
                statusBox.textContent = `Error: ${err.message || err}`;
            }
        });

        // Real YouTube Backend Pipeline Interaction
        btn.addEventListener('click', async () => {
            const query = input.value.trim();
            if (!query) return;

            const currentLang = getLang();
            statusBox.style.display = 'block';
            statusBox.style.background = 'rgba(138, 92, 246, 0.1)';
            statusBox.style.color = 'var(--accent-premium)';
            
            statusBox.textContent = currentLang === 'de'
                ? `Backend konvertiert und lädt herunter: "${query}"...`
                : `Backend downloading & converting: "${query}"...`;

            try {
                // Handover execution completely to the core backend to prevent browser CORS blockades
                await invokeBackend('download_youtube', { query: query });

                statusBox.style.background = 'rgba(34, 197, 94, 0.1)';
                statusBox.style.color = '#22c55e';
                statusBox.textContent = currentLang === 'de'
                    ? `Erfolgreich! "${query}" wurde im Musikpool hinterlegt.`
                    : `Success! "${query}" downloaded to music library.`;
                
                input.value = '';
            } catch (err) {
                statusBox.style.background = 'rgba(239, 68, 68, 0.1)';
                statusBox.style.color = '#ef4444';
                statusBox.textContent = currentLang === 'de'
                    ? `Fehler beim Herunterladen: ${err.message || err}`
                    : `Download pipeline failure: ${err.message || err}`;
            }
        });
    }
};