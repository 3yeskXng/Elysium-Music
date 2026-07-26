// elysium-ui/src/utils/dependencyService.js
// Cross-platform dependency check and auto-installer for download pipeline

import { invokeBackend } from '../api.js';
import { t } from './translate.js';

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
    const hint = t('dl_missing_hint').replace('${deps}', parts);

    statusBox.style.display = 'block';
    statusBox.style.background = 'rgba(255,180,0,0.1)';
    statusBox.style.color = '#eab308';
    statusBox.style.padding = '12px 16px';
    statusBox.style.borderRadius = '6px';
    statusBox.style.fontSize = '0.9rem';
    statusBox.textContent = hint;
    log('WARN', `Missing dependencies: ${missing.join(', ')}`);
}
