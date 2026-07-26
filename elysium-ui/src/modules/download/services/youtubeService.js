// elysium-ui/src/modules/download/services/youtubeService.js
// YouTube download handler with yt-dlp availability check and auto-install

import { invokeBackend } from '../../../api.js';
import { pluginManager } from '../../../core/pluginManager.js';
import { translations } from '../../../config/translations.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { ensureYtDlp } from '../../../utils/dependencyService.js';

const getLang = () => localStorage.getItem('elysium_language') || 'de';

function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Download', msg);
}

export async function handleDownload(input, status) {
    const query = input.value.trim();
    if (!query) return;
    const lang = getLang();

    if (!pluginManager.isPluginActive('youtube_core')) {
        const t = translations[lang] || translations.de;
        setStatus(status, 'rgba(255,255,255,0.05)', 'var(--text-muted)', t.dl_plugin_off);
        log('INFO', 'Download skipped: plugin "youtube_core" is disabled');
        return;
    }

    ensureYtDlp(status, () => executeDownload(input, status, query));
}

async function executeDownload(input, status, query) {
    const lang = getLang();
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
