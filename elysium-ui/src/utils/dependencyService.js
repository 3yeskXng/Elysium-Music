// elysium-ui/src/utils/dependencyService.js
// Cross-platform dependency check and auto-installer for download pipeline

import { invokeBackend } from '../api.js';
import { translations } from '../config/translations.js';
import { showLoader, hideLoader } from '../core/loader.js';

const getLang = () => localStorage.getItem('elysium_language') || 'de';

function log(level, msg) {
    if (window.triggerElysiumLog) window.triggerElysiumLog(level, 'Dependency', msg);
}

export async function checkAllDependencies() {
    try {
        return await invokeBackend('check_all_dependencies');
    } catch {
        return { ytdlp: true, ffmpeg: true, ffprobe: true };
    }
}

export async function ensureYtDlp(statusBox, onReady) {
    const lang = getLang();
    const t = translations[lang] || translations.de;

    let status;
    try {
        status = await checkAllDependencies();
    } catch {
        status = { ytdlp: true, ffmpeg: true, ffprobe: true };
    }

    const missing = [];
    if (!status.ytdlp) missing.push('yt-dlp');
    if (!status.ffmpeg) missing.push('ffmpeg');
    if (!status.ffprobe) missing.push('ffprobe');

    if (missing.length === 0) {
        onReady();
        return;
    }

    const parts = missing.map(m => `<strong>${m}</strong>`).join(', ');
    const hint = lang === 'de'
        ? `Fehlende Abhängigkeiten: ${parts}. Installiere sie in den Einstellungen unter "Abhängigkeiten verwalten".`
        : `Missing dependencies: ${parts}. Install them in Settings under "Manage Dependencies".`;

    statusBox.style.display = 'block';
    statusBox.style.background = 'rgba(255,180,0,0.1)';
    statusBox.style.color = '#eab308';
    statusBox.style.padding = '12px 16px';
    statusBox.style.borderRadius = '6px';
    statusBox.style.fontSize = '0.9rem';
    statusBox.textContent = hint;
    log('WARN', `Missing dependencies: ${missing.join(', ')}`);
}
