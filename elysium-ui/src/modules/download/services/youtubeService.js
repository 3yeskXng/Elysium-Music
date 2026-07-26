// elysium-ui/src/modules/download/services/youtubeService.js
// YouTube download handler with yt-dlp availability check and auto-install

import { invokeBackend } from '../../../api.js';
import { pluginManager } from '../../../core/pluginManager.js';
import { t } from '../../../utils/translate.js';
import { showLoader, hideLoader } from '../../../core/loader.js';
import { ensureYtDlp } from '../../../utils/dependencyService.js';

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

    if (!pluginManager.isPluginActive('youtube_core')) {
        setStatus(status, 'rgba(255,255,255,0.05)', 'var(--text-muted)', t('dl_plugin_off'));
        log('INFO', 'Download skipped: plugin "youtube_core" is disabled');
        return;
    }

    ensureYtDlp(status, () => executeDownload(input, status, query));
}

async function executeDownload(input, status, query) {
    showLoader(status.parentElement, t('dl_downloading') + '...');
    setStatus(status, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
        t('dl_downloading_status').replace('${query}', query));
    log('INFO', `Download initiated: "${query}" — Handing off to yt-dlp backend pipeline`);

    try {
        const result = await invokeBackend('download_youtube', { query });
        setStatus(status, 'rgba(34,197,94,0.1)', '#22c55e',
            t('dl_success').replace('${title}', result.title || query));
        log('SUCCESS', `Download complete: "${result.title || query}" by ${result.artist || 'Unknown'} — Duration: ${result.duration || 'N/A'} — Path: ${result.file_path || 'N/A'}`);
        input.value = '';
        window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
    } catch (err) {
        setStatus(status, 'rgba(239,68,68,0.1)', '#ef4444',
            `${t('dl_error')}: ${err.message || err}`);
        log('ERROR', `Download failed for "${query}": ${err.message || err}`);
    } finally {
        hideLoader(status.parentElement);
    }
}
