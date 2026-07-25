// elysium-ui/src/modules/downloadModule.js
// YouTube download pipeline and local file import controller

import { invokeBackend } from '../api.js';
import { pluginManager } from '../core/pluginManager.js';
import { translations } from '../config/translations.js';
import { showLoader, hideLoader } from '../core/loader.js';

const ICON_DOWNLOAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

const getLang = () => localStorage.getItem('elysium_language') || 'de';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Download', msg);
}

function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

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
        fileInput.addEventListener('change', (e) => this.handleFileImport(e, status));
        dlBtn.addEventListener('click', () => this.handleDownload(input, status));
    },

    async handleFileImport(e, status) {
        const file = e.target.files[0];
        if (!file) return;
        const lang = getLang();
        const t = translations[lang] || translations.de;
        showLoader(status.parentElement, t.import_btn || 'Importing...');
        setStatus(status, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
            lang === 'de' ? `Kopiere "${file.name}"...` : `Copying "${file.name}"...`);

        try {
            const buf = await file.arrayBuffer();
            const bytes = Array.from(new Uint8Array(buf));
            const name = file.name.replace(/\.(opus|mp3)$/i, '');
            await invokeBackend('save_track', { title: name, bytes });

            setStatus(status, 'rgba(34,197,94,0.1)', '#22c55e',
                lang === 'de' ? `Erfolgreich kopiert!` : `Successfully imported!`);
            log('SUCCESS', `File imported: "${file.name}" (${(file.size / 1024).toFixed(1)} KB) → music/${name}.opus`);
            window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
        } catch (err) {
            setStatus(status, 'rgba(239,68,68,0.1)', '#ef4444', `Error: ${err.message || err}`);
            log('ERROR', `File import failed: "${file.name}" — ${err.message || err}`);
        } finally {
            hideLoader(status.parentElement);
        }
        e.target.value = '';
    },

    async handleDownload(input, status) {
        const query = input.value.trim();
        if (!query) return;
        const lang = getLang();

        if (!pluginManager.isPluginActive('youtube_core')) {
            const lang = localStorage.getItem('elysium_language') || 'de';
            const t = translations[lang] || translations.de;
            setStatus(status, 'rgba(255,255,255,0.05)', 'var(--text-muted)', t.dl_plugin_off || 'YouTube plugin is disabled.');
            log('INFO', `Download skipped: plugin "youtube_core" is disabled`);
            return;
        }

        showLoader(status.parentElement, lang === 'de' ? 'Lädt herunter...' : 'Downloading...');
        setStatus(status, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
            lang === 'de' ? `Backend konvertiert und lädt herunter: "${query}"...` : `Backend downloading & converting: "${query}"...`);
        log('INFO', `Download initiated: "${query}" — Handing off to yt-dlp backend pipeline`);

        try {
            const result = await invokeBackend('download_youtube', { query });
            setStatus(status, 'rgba(34,197,94,0.1)', '#22c55e',
                lang === 'de' ? `Erfolgreich! "${result.title || query}" wurde im Musikpool hinterlegt.` : `Success! "${result.title || query}" downloaded to music library.`);
            log('SUCCESS', `Download complete: "${result.title || query}" by ${result.artist || 'Unknown'} — Duration: ${result.duration || 'N/A'} — Path: ${result.file_path || 'N/A'}`);
            input.value = '';
            window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
        } catch (err) {
            setStatus(status, 'rgba(239,68,68,0.1)', '#ef4444',
                lang === 'de' ? `Fehler beim Herunterladen: ${err.message || err}` : `Download pipeline failure: ${err.message || err}`);
            log('ERROR', `Download failed for "${query}": ${err.message || err}`);
        } finally {
            hideLoader(status.parentElement);
        }
    }
};
