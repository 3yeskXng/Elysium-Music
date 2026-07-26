// elysium-ui/src/modules/download/DownloadView.js
// Download module view — UI layout and event wiring

import { ICON_DOWNLOAD } from '../../config/icons.js';
import { handleDownload } from './services/youtubeService.js';
import { handleFileImport } from './services/localImportService.js';

export const downloadModule = {
    id: 'download',
    label: 'Laden',
    icon: ICON_DOWNLOAD,

    render() {
        const vp = document.createElement('div');
        vp.className = 'view-container animate-fade-in';
        vp.innerHTML = `
            <h2 class="view-title" data-i18n="dl_title">Mittelpunkt-Audio-Downloader</h2>
            <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:24px;" data-i18n="dl_sub">Geben Sie einen Songtitel ein, um ihn direkt via Netzwerkintegration herunterzuladen.</p>
            <div style="display:flex; gap:12px; margin-bottom:32px;">
                <input type="text" id="download-input" data-i18n="dl_placeholder" placeholder="Z.B. Linkin Park - Numb" style="flex:1; padding:12px 16px; background:var(--bg-sidebar); border:1px solid var(--border-subtle); border-radius:6px; color:var(--text-main); font-size:0.95rem; outline:none;">
                <button id="download-trigger" data-i18n="dl_btn" style="background:var(--accent-premium); border:none; color:white; font-weight:600; padding:0 24px; border-radius:6px; cursor:pointer; font-size:0.95rem;">Download</button>
            </div>
            <div style="padding:24px; border:1px solid var(--border-subtle); background:var(--bg-sidebar); border-radius:8px; margin-bottom:24px;">
                <h3 style="font-size:1rem; margin-bottom:8px; color:var(--text-main); font-weight:600;" data-i18n="import_title">Manueller Datei-Import</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:16px;" data-i18n="import_sub">Füge vorhandene .opus oder .mp3 Dateien von deinem PC direkt über das Interface zur App-Bibliothek hinzu.</p>
                <button id="import-trigger" data-i18n="import_btn" style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); color:var(--text-main); font-weight:600; padding:10px 18px; border-radius:6px; cursor:pointer; font-size:0.85rem; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">Datei auswählen & importieren</button>
                <input type="file" id="hidden-file-input" accept=".opus,.mp3" style="display:none;">
            </div>
            <div id="download-status-box" style="display:none; padding:16px; border-radius:6px; font-size:0.9rem; line-height:1.4; user-select:text;"></div>
        `;
        this.wireEvents(vp);
        return vp;
    },

    wireEvents(vp) {
        const input = vp.querySelector('#download-input');
        const dlBtn = vp.querySelector('#download-trigger');
        const status = vp.querySelector('#download-status-box');
        const importBtn = vp.querySelector('#import-trigger');
        const fileInput = vp.querySelector('#hidden-file-input');

        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFileImport(e, status));
        dlBtn.addEventListener('click', () => handleDownload(input, status));
    }
};
