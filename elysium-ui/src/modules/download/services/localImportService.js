// elysium-ui/src/modules/download/services/localImportService.js
// Local file import handler — reads .opus/.mp3 and sends to backend

import { invokeBackend } from '../../../api.js';
import { translations } from '../../../config/translations.js';
import { showLoader, hideLoader } from '../../../core/loader.js';

function t(key) {
    const lang = localStorage.getItem('elysium_language') || 'de';
    const dict = translations[lang] || translations.de;
    return dict[key] || key;
}

function setStatus(box, bg, color, text) {
    box.style.display = 'block';
    box.style.background = bg;
    box.style.color = color;
    box.textContent = text;
}

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Download', msg);
}

export async function handleFileImport(e, status) {
    const file = e.target.files[0];
    if (!file) return;
    showLoader(status.parentElement, t('dl_installing'));
    setStatus(status, 'rgba(138,92,246,0.1)', 'var(--accent-premium)',
        t('dl_copying').replace('${name}', file.name));

    try {
        const buf = await file.arrayBuffer();
        const bytes = Array.from(new Uint8Array(buf));
        const name = file.name.replace(/\.(opus|mp3)$/i, '');
        await invokeBackend('save_track', { title: name, bytes });

        setStatus(status, 'rgba(34,197,94,0.1)', '#22c55e', t('dl_import_success'));
        log('SUCCESS', `File imported: "${file.name}" (${(file.size / 1024).toFixed(1)} KB) -> music/${name}.opus`);
        window.dispatchEvent(new CustomEvent('elysium-library-refresh'));
    } catch (err) {
        setStatus(status, 'rgba(239,68,68,0.1)', '#ef4444', `${t('deps_lib_error')}: ${err.message || err}`);
        log('ERROR', `File import failed: "${file.name}" — ${err.message || err}`);
    } finally {
        hideLoader(status.parentElement);
    }
    e.target.value = '';
}
